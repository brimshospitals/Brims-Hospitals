import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import LabTest from "../../../models/LabTest";
import Transaction from "../../../models/Transaction";
import Notification from "../../../models/Notification";

export const dynamic = "force-dynamic";

const SALT_KEY   = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

function verifyCallbackChecksum(encodedResponse, xVerifyHeader) {
  if (!xVerifyHeader || !SALT_KEY) return false;
  const expected =
    crypto.createHash("sha256")
      .update(encodedResponse + SALT_KEY)
      .digest("hex") +
    "###" + SALT_INDEX;
  return xVerifyHeader === expected;
}

export async function POST(request) {
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  try {
    const body   = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    const url       = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");
    const txnId     = url.searchParams.get("txnId");

    if (!encodedResponse || !bookingId) {
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    // ── Checksum verification (security: prevent forged callbacks) ────────────
    const xVerify = request.headers.get("x-verify") || request.headers.get("X-VERIFY");
    if (!verifyCallbackChecksum(encodedResponse, xVerify)) {
      console.error("Lab payment callback checksum mismatch — possible forged request");
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const decoded = JSON.parse(Buffer.from(encodedResponse, "base64").toString("utf-8"));
    const { code, data } = decoded;

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    if (code !== "PAYMENT_SUCCESS") {
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    // ── Idempotency: already confirmed — treat as success ─────────────────────
    if (booking.paymentStatus === "paid") {
      return NextResponse.redirect(
        `${base}/lab-tests?payment=success&bookingId=${booking.bookingId}`
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const phonePeTxnId = data?.transactionId || txnId;
    const paidAmount   = data?.amount ? data.amount / 100 : booking.amount;

    // Confirm booking
    booking.status        = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentId     = phonePeTxnId;
    await booking.save();

    // Lab test booking count
    if (booking.labTestId) {
      await LabTest.findByIdAndUpdate(booking.labTestId, { $inc: { totalBookings: 1 } });
    }

    // ── Platform income Transaction record ────────────────────────────────────
    try {
      // Confirm any pending Transaction created at booking time
      const updated = await Transaction.findOneAndUpdate(
        { bookingId: booking._id, category: "booking_payment", status: "pending" },
        { $set: { status: "success", paymentId: phonePeTxnId } }
      );
      // If no pending record existed, create one now
      if (!updated) {
        await Transaction.create({
          userId:      booking.userId,
          type:        "credit",
          amount:      paidAmount,
          description: `Lab Booking Payment — ${booking.bookingId}`,
          bookingId:   booking._id,
          referenceId: booking.bookingId,
          paymentId:   phonePeTxnId,
          category:    "booking_payment",
          status:      "success",
        });
      }
    } catch (txnErr) {
      console.error("Lab payment Transaction error:", txnErr.message);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Patient notification
    try {
      await Notification.create({
        userId:  booking.userId,
        type:    "payment",
        title:   "Lab Booking Confirmed — Payment Received",
        message: `Booking ID: ${booking.bookingId} | ₹${paidAmount} payment successful.`,
      });
    } catch {}

    return NextResponse.redirect(
      `${base}/lab-tests?payment=success&bookingId=${booking.bookingId}`
    );
  } catch (error) {
    console.error("Lab Payment Callback Error:", error);
    const base2 = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
    return NextResponse.redirect(`${base2}/lab-tests?payment=failed`);
  }
}

export async function GET(request) {
  const url  = new URL(request.url);
  const base = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  const p    = url.searchParams.get("payment") || "failed";
  return NextResponse.redirect(`${base}/lab-tests?payment=${p}`);
}
