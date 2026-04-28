import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import LabTest from "../../../models/LabTest";
import Booking from "../../../models/Booking";
import BookingDraft from "../../../models/BookingDraft";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";

async function generateBookingId() {
  const count = await Booking.countDocuments();
  return `BH-LAB-${String(count + 1).padStart(5, "0")}`;
}

export async function POST(request) {
  try {
    const { userId, memberId, labTestId, appointmentDate, slot, homeCollection, homeAddress, amount,
            patientName, patientMobile, patientAge, patientGender, promoCode, promoDiscount, draftId } =
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
    const bookingId = await generateBookingId();
    const notes = JSON.stringify({
      patientName:    patientName  || user.name,
      patientMobile:  patientMobile || user.mobile,
      patientAge:     patientAge   || "",
      patientGender:  patientGender || "",
      paymentMode:    "online",
      homeAddress:    homeAddress  || null,
      promoCode:      promoCode    || null,
      promoDiscount:  promoDiscount || 0,
    });

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
      paymentMode: "online",
      amount,
      familyCardId: user.familyCardId || null,
      notes,
    });

    // PhonePe order banao
    // NOTE: Draft is marked converted only AFTER PhonePe URL is successfully obtained (below)
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
      // PhonePe URL nahi mili — booking delete karo (draft stays active for retry)
      await Booking.deleteOne({ _id: booking._id });
      return NextResponse.json(
        { success: false, message: "Payment URL nahi mili. Dobara try karein." },
        { status: 500 }
      );
    }

    // PhonePe URL mili — ab draft ko converted mark karo
    try {
      if (draftId) {
        await BookingDraft.findOneAndUpdate(
          { _id: draftId, userId },
          { $set: { status: "converted", convertedBookingId: bookingId } }
        );
      } else {
        await BookingDraft.findOneAndUpdate(
          { userId, type: "Lab", itemId: labTestId, status: "active" },
          { $set: { status: "converted", convertedBookingId: bookingId } }
        );
      }
    } catch {}

    return NextResponse.json({ success: true, redirectUrl, bookingId });
  } catch (error) {
    console.error("Lab Order Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: "Payment error: " + error.message },
      { status: 500 }
    );
  }
}
