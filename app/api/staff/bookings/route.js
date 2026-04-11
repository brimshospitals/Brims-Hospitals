import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const type   = searchParams.get("type")   || "all";
    const search = searchParams.get("search") || "";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 30;

    await connectDB();

    const query = {};
    if (status !== "all") query.status = status;
    if (type   !== "all") query.type   = type;

    // Date filter: today / week
    const dateFilter = searchParams.get("date") || "";
    const now  = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    if (dateFilter === "today") {
      const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
      query.appointmentDate = { $gte: today, $lt: tomorrow };
    } else if (dateFilter === "week") {
      const nextWeek = new Date(today); nextWeek.setDate(nextWeek.getDate() + 7);
      query.appointmentDate = { $gte: today, $lt: nextWeek };
    }

    let userIds = [];

    // If search, find matching users first
    if (search.trim()) {
      const users = await User.find({
        $or: [
          { name:   { $regex: search.trim(), $options: "i" } },
          { mobile: { $regex: search.trim(), $options: "i" } },
        ],
      }).select("_id").lean();
      userIds = users.map((u) => u._id);
      query.$or = [
        { userId:    { $in: userIds } },
        { bookingId: { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean();

    // Fetch patient names
    const allUserIds = [...new Set(bookings.map((b) => b.userId?.toString()).filter(Boolean))];
    const users      = await User.find({ _id: { $in: allUserIds } }).select("name mobile photo").lean();
    const userMap    = {};
    users.forEach((u) => { userMap[u._id.toString()] = u; });

    const enriched = bookings.map((b) => {
      const patient = userMap[b.userId?.toString()] || {};
      let extra = {};
      try { extra = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return {
        ...b,
        patientName:   patient.name   || "Unknown",
        patientMobile: patient.mobile || "",
        consultType:   extra.consultType || "",
      };
    });

    // Quick stats
    const [todayPending, totalPending, totalConfirmed] = await Promise.all([
      Booking.countDocuments({ status: "pending", appointmentDate: { $gte: today } }),
      Booking.countDocuments({ status: "pending" }),
      Booking.countDocuments({ status: "confirmed" }),
    ]);

    return NextResponse.json({
      success: true,
      bookings: enriched,
      total,
      pages: Math.ceil(total / limit),
      page,
      stats: { todayPending, totalPending, totalConfirmed },
    });
  } catch (error) {
    console.error("Staff Bookings Error:", error);
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// PATCH — update booking status
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const { bookingId, status } = await request.json();
    if (!bookingId || !status) {
      return NextResponse.json({ success: false, message: "bookingId and status required" }, { status: 400 });
    }

    await connectDB();
    const booking = await Booking.findByIdAndUpdate(bookingId, { status }, { new: true });
    if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    return NextResponse.json({ success: true, booking });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
