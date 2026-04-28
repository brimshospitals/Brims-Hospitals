import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import Transaction from "../../../models/Transaction";
import Notification from "../../../models/Notification";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    const url = new URL(request.url);
    const bookingId  = url.searchParams.get("bookingId");
    const txnId      = url.searchParams.get("txnId");
    const isBalance  = url.searchParams.get("isBalance") === "1";

    const base = process.env.NEXTAUTH_URL;

    if (!encodedResponse || !bookingId) {
      return NextResponse.redirect(`${base}/my-bookings?payment=failed`);
    }

    const decoded = JSON.parse(Buffer.from(encodedResponse, "base64").toString("utf-8"));
    const { code, data } = decoded;

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.redirect(`${base}/my-bookings?payment=failed`);
    }

    if (code !== "PAYMENT_SUCCESS") {
      // Keep booking as-is — user can retry
      return NextResponse.redirect(`${base}/my-bookings?payment=failed`);
    }

    const paymentId = data?.transactionId || txnId;

    if (isBalance) {
      // Balance payment for partial Surgery booking
      booking.balanceAmount  = 0;
      booking.paymentStatus  = "paid";
      booking.paymentId      = paymentId;
      await booking.save();

      try {
        await Transaction.findOneAndUpdate(
          { bookingId: booking._id, category: "booking_payment", status: "pending", description: /balance/i },
          { $set: { status: "success", paymentId } }
        );
      } catch {}

      try {
        await Notification.create({
          userId: booking.userId,
          type: "payment",
          title: "Balance Payment Confirmed",
          message: `Booking ${booking.bookingId} — Balance payment successful. Full amount paid.`,
        });
      } catch {}
    } else {
      // Full booking payment
      booking.status        = "confirmed";
      booking.paymentStatus = "paid";
      booking.paymentId     = paymentId;
      await booking.save();

      // Confirm the pending Transaction record
      try {
        await Transaction.findOneAndUpdate(
          { bookingId: booking._id, category: "booking_payment", status: "pending" },
          { $set: { status: "success", paymentId } }
        );
      } catch {}

      try {
        await Notification.create({
          userId: booking.userId,
          type: "payment",
          title: "Booking Confirmed — Payment Received",
          message: `Booking ID: ${booking.bookingId} | ₹${booking.amount} payment successful.`,
        });
      } catch {}
    }

    return NextResponse.redirect(
      `${base}/my-bookings?payment=success&bookingId=${booking.bookingId}`
    );
  } catch (error) {
    console.error("Booking Payment Callback Error:", error);
    const base = process.env.NEXTAUTH_URL;
    return NextResponse.redirect(`${base}/my-bookings?payment=failed`);
  }
}

export async function GET(request) {
  const url  = new URL(request.url);
  const base = process.env.NEXTAUTH_URL;
  const p    = url.searchParams.get("payment") || "failed";
  const bid  = url.searchParams.get("bookingId") || "";
  if (p === "success" && bid) {
    return NextResponse.redirect(`${base}/my-bookings?payment=success&bookingId=${bid}`);
  }
  return NextResponse.redirect(`${base}/my-bookings?payment=${p}`);
}
