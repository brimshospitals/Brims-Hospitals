import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import LabTest from "../../../models/LabTest";
import Booking from "../../../models/Booking";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";

function generateBookingId() {
  return "BRIMS-LAB-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const { userId, memberId, labTestId, appointmentDate, slot, homeCollection, amount } =
      await request.json();

    if (!userId || !labTestId || !amount) {
      return NextResponse.json(
        { success: false, message: "userId, labTestId aur amount zaruri hain" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    const test = await LabTest.findById(labTestId);

    if (!user || !test) {
      return NextResponse.json(
        { success: false, message: "User ya Lab Test nahi mila" },
        { status: 404 }
      );
    }

    // Pehle pending booking banao
    const bookingId = generateBookingId();
    const booking = await Booking.create({
      bookingId,
      type: "Lab",
      userId,
      memberId: memberId || userId,
      labTestId,
      hospitalId: test.hospitalId,
      appointmentDate: appointmentDate ? new Date(appointmentDate) : null,
      slot: slot || (homeCollection ? "Home Collection" : null),
      status: "pending",
      paymentStatus: "pending",
      amount,
      familyCardId: user.familyCardId || null,
      notes: `Lab Test: ${test.name}${homeCollection ? " (Home Collection)" : ""} | Payment: Online`,
    });

    // PhonePe order banao
    const transactionId = "BRIMSLAB" + Date.now();
    const amountInPaise = Math.round(amount * 100);

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amountInPaise,
      redirectUrl: `${process.env.NEXTAUTH_URL}/api/lab-payment-callback?bookingId=${booking._id}&txnId=${transactionId}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/lab-payment-callback?bookingId=${booking._id}&txnId=${transactionId}`,
      mobileNumber: user.mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    const checksum =
      crypto
        .createHash("sha256")
        .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
        .digest("hex") +
      "###" +
      SALT_INDEX;

    const response = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
        },
      }
    );

    const redirectUrl = response.data?.data?.instrumentResponse?.redirectInfo?.url;

    if (!redirectUrl) {
      // PhonePe URL nahi mili — booking delete karo
      await Booking.deleteOne({ _id: booking._id });
      return NextResponse.json(
        { success: false, message: "Payment URL nahi mili. Dobara try karein." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, redirectUrl, bookingId });
  } catch (error) {
    console.error("Lab Order Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: "Payment error: " + error.message },
      { status: 500 }
    );
  }
}
