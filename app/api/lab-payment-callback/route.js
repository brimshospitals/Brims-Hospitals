import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import LabTest from "../../../models/LabTest";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    const url = new URL(request.url);
    const bookingId = url.searchParams.get("bookingId");
    const txnId     = url.searchParams.get("txnId");

    const base = process.env.NEXTAUTH_URL;

    if (!encodedResponse || !bookingId) {
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    const decoded = JSON.parse(Buffer.from(encodedResponse, "base64").toString("utf-8"));
    const { code, data } = decoded;

    await connectDB();

    const booking = await Booking.findById(bookingId);
    if (!booking) {
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    if (code !== "PAYMENT_SUCCESS") {
      // Keep booking as "pending" so user can retry payment
      // (Don't cancel — user can see it in in-progress banner and pay again)
      return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
    }

    // Payment success — booking confirm karo
    booking.status        = "confirmed";
    booking.paymentStatus = "paid";
    booking.paymentId     = data?.transactionId || txnId;
    await booking.save();

    // Lab test booking count update
    if (booking.labTestId) {
      await LabTest.findByIdAndUpdate(booking.labTestId, { $inc: { totalBookings: 1 } });
    }

    return NextResponse.redirect(
      `${base}/lab-tests?payment=success&bookingId=${booking.bookingId}`
    );
  } catch (error) {
    console.error("Lab Payment Callback Error:", error);
    const base = process.env.NEXTAUTH_URL;
    return NextResponse.redirect(`${base}/lab-tests?payment=failed`);
  }
}

export async function GET(request) {
  const url  = new URL(request.url);
  const base = process.env.NEXTAUTH_URL;
  const p    = url.searchParams.get("payment") || "failed";
  return NextResponse.redirect(`${base}/lab-tests?payment=${p}`);
}
