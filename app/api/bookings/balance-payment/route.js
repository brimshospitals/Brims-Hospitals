import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import User from "../../../../models/User";
import Transaction from "../../../../models/Transaction";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";

// POST — pay remaining balance on a partial Surgery booking
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin"]);
  if (error) return error;

  try {
    const { bookingId, paymentMode } = await request.json();

    if (!bookingId || !paymentMode) {
      return NextResponse.json(
        { success: false, message: "bookingId aur paymentMode zaruri hai" },
        { status: 400 }
      );
    }
    if (!["wallet", "online"].includes(paymentMode)) {
      return NextResponse.json(
        { success: false, message: "paymentMode sirf wallet ya online ho sakta hai" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find by bookingId string (human-readable ID)
    const booking = await Booking.findOne({ bookingId });
    if (!booking) {
      return NextResponse.json(
        { success: false, message: "Booking nahi mili" },
        { status: 404 }
      );
    }

    // Ownership check
    if (booking.userId.toString() !== session.userId.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap is booking ka balance nahi de sakte" },
        { status: 403 }
      );
    }

    // Validation
    if (booking.type !== "Surgery") {
      return NextResponse.json(
        { success: false, message: "Sirf Surgery bookings mein balance payment hoti hai" },
        { status: 400 }
      );
    }
    if (!booking.isPartialBooking || !booking.balanceAmount || booking.balanceAmount <= 0) {
      return NextResponse.json(
        { success: false, message: "Is booking mein koi balance pending nahi hai" },
        { status: 400 }
      );
    }
    if (["cancelled", "completed"].includes(booking.status)) {
      return NextResponse.json(
        { success: false, message: `Booking already ${booking.status} hai` },
        { status: 400 }
      );
    }

    const balance = booking.balanceAmount;

    // ── Wallet Payment ─────────────────────────────────────────────────────────
    if (paymentMode === "wallet") {
      const updatedUser = await User.findOneAndUpdate(
        { _id: session.userId, walletBalance: { $gte: balance } },
        { $inc: { walletBalance: -balance } }
      );
      if (!updatedUser) {
        const u = await User.findById(session.userId, "walletBalance").lean();
        return NextResponse.json(
          { success: false, message: `Wallet mein balance nahi hai. Available: ₹${u?.walletBalance || 0}` },
          { status: 400 }
        );
      }

      booking.balanceAmount  = 0;
      booking.paymentStatus  = "paid";
      await booking.save();

      try {
        await Transaction.create({
          userId:      session.userId,
          type:        "debit",
          amount:      balance,
          description: `Wallet Balance Payment — Surgery Booking (${bookingId})`,
          bookingId:   booking._id,
          referenceId: bookingId,
          category:    "booking_payment",
          status:      "success",
        });
      } catch {}

      return NextResponse.json({
        success: true,
        message: `₹${balance.toLocaleString("en-IN")} wallet se kat gaye. Balance paid!`,
      });
    }

    // ── Online (PhonePe) Payment ───────────────────────────────────────────────
    const transactionId  = "BRIMSBAL" + Date.now();
    const amountInPaise  = Math.round(balance * 100);

    const payload = {
      merchantId:            MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId:        session.userId,
      amount:                amountInPaise,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/booking-payment-callback?bookingId=${booking._id}&txnId=${transactionId}&isBalance=1`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/booking-payment-callback?bookingId=${booking._id}&txnId=${transactionId}&isBalance=1`,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum =
      crypto.createHash("sha256")
        .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
        .digest("hex") +
      "###" + SALT_INDEX;

    const phonepeRes = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      { headers: { "Content-Type": "application/json", "X-VERIFY": checksum } }
    );

    const redirectUrl = phonepeRes.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      return NextResponse.json(
        { success: false, message: "Payment URL nahi mili. Dobara try karein." },
        { status: 500 }
      );
    }

    // Create pending Transaction record
    try {
      await Transaction.create({
        userId:      session.userId,
        type:        "credit",
        amount:      balance,
        description: `Online Balance Payment — Surgery Booking (${bookingId})`,
        bookingId:   booking._id,
        referenceId: bookingId,
        category:    "booking_payment",
        status:      "pending",
      });
    } catch {}

    return NextResponse.json({ success: true, redirectUrl });
  } catch (err) {
    console.error("Balance Payment Error:", err?.response?.data || err.message);
    return NextResponse.json(
      { success: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
