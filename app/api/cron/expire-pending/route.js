import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import Transaction from "../../../../models/Transaction";

export const dynamic = "force-dynamic";

// Daily cron — cancel online bookings that never completed payment after 24h
// Prevents zombie "pending" bookings from abandoned PhonePe sessions
export async function GET(request) {
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}` && process.env.NODE_ENV === "production") {
    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();

    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000); // 24 hours ago

    // Find online-payment bookings stuck in pending for > 24h
    const stale = await Booking.find({
      paymentMode:   "online",
      paymentStatus: "pending",
      status:        "pending",
      createdAt:     { $lt: cutoff },
    }).select("_id bookingId userId type amount").lean();

    if (stale.length === 0) {
      return NextResponse.json({ success: true, cancelled: 0, message: "Koi stale booking nahi mili" });
    }

    const ids = stale.map((b) => b._id);

    // Bulk cancel
    await Booking.updateMany(
      { _id: { $in: ids } },
      { $set: { status: "cancelled", paymentStatus: "failed" } }
    );

    // Mark matching pending Transaction records as failed
    await Transaction.updateMany(
      { bookingId: { $in: ids }, status: "pending", category: "booking_payment" },
      { $set: { status: "failed" } }
    );

    console.log(`[expire-pending] Cancelled ${stale.length} stale online bookings`);

    return NextResponse.json({
      success: true,
      cancelled: stale.length,
      bookingIds: stale.map((b) => b.bookingId),
    });
  } catch (err) {
    console.error("Expire Pending Cron Error:", err.message);
    return NextResponse.json(
      { success: false, message: "Server error: " + err.message },
      { status: 500 }
    );
  }
}
