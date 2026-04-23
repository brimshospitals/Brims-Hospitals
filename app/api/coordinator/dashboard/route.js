import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "admin"]);
  if (error) return error;

  try {
    await connectDB();

    // Find coordinator by userId
    const coord = await Coordinator.findOne({ userId: session.userId }).lean();
    if (!coord) {
      return NextResponse.json({ success: false, message: "Coordinator profile nahi mila" }, { status: 404 });
    }

    // Bookings made through this coordinator
    const bookings = await Booking.find({ coordinatorId: coord._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Stats
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const thisMonth = new Date(today.getFullYear(), today.getMonth(), 1);

    const todayBookings  = bookings.filter(b => new Date(b.createdAt) >= today);
    const monthBookings  = bookings.filter(b => new Date(b.createdAt) >= thisMonth);

    const totalEarned   = bookings.reduce((s, b) => s + (b.coordinatorCommission || 0), 0);
    const pendingEarned = bookings.filter(b => !b.coordinatorPaid).reduce((s, b) => s + (b.coordinatorCommission || 0), 0);
    const paidEarned    = bookings.filter(b => b.coordinatorPaid).reduce((s, b) => s + (b.coordinatorCommission || 0), 0);

    // Unique clients
    const clientMobiles = new Set();
    let notes;
    bookings.forEach(b => {
      try { notes = JSON.parse(b.notes || "{}"); } catch { notes = {}; }
      if (notes.patientMobile) clientMobiles.add(notes.patientMobile);
    });

    return NextResponse.json({
      success: true,
      coordinator: coord,
      stats: {
        totalBookings:  bookings.length,
        todayBookings:  todayBookings.length,
        monthBookings:  monthBookings.length,
        totalClients:   clientMobiles.size,
        totalEarned,
        pendingEarned,
        paidEarned,
      },
      bookings,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}