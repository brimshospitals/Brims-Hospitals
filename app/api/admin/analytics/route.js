import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import User    from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const days = parseInt(searchParams.get("days") || "30");

    await connectDB();

    const since = new Date();
    since.setDate(since.getDate() - days);
    since.setHours(0, 0, 0, 0);

    // ── 1. Daily bookings + revenue (last N days) ──────────────────────────────
    const dailyBookings = await Booking.aggregate([
      { $match: { createdAt: { $gte: since } } },
      {
        $group: {
          _id: {
            year:  { $year:  "$createdAt" },
            month: { $month: "$createdAt" },
            day:   { $dayOfMonth: "$createdAt" },
          },
          count:   { $sum: 1 },
          revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus", "paid"] }, "$amount", 0] } },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
    ]);

    // Build a full date map (fill missing days with 0)
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      dateMap[key] = { date: key, count: 0, revenue: 0 };
    }
    dailyBookings.forEach(({ _id, count, revenue }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2,"0")}-${String(_id.day).padStart(2,"0")}`;
      if (dateMap[key]) { dateMap[key].count = count; dateMap[key].revenue = revenue; }
    });
    const trend = Object.values(dateMap);

    // ── 2. Bookings by type ────────────────────────────────────────────────────
    const byType = await Booking.aggregate([
      { $group: { _id: "$type", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } } } },
      { $sort: { count: -1 } },
    ]);

    // ── 3. Bookings by status ──────────────────────────────────────────────────
    const byStatus = await Booking.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // ── 4. New users per week (last 4 weeks) ───────────────────────────────────
    const fourWeeksAgo = new Date();
    fourWeeksAgo.setDate(fourWeeksAgo.getDate() - 28);

    const newUsers = await User.aggregate([
      { $match: { createdAt: { $gte: fourWeeksAgo }, role: { $in: ["user","member"] } } },
      {
        $group: {
          _id: { $week: "$createdAt" },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id": 1 } },
    ]);

    // ── 5. Summary totals ──────────────────────────────────────────────────────
    const totalRevenuePaid = await Booking.aggregate([
      { $match: { paymentStatus: "paid" } },
      { $group: { _id: null, total: { $sum: "$amount" } } },
    ]);

    const totalBookingsThisMonth = await Booking.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
    });

    const totalUsersThisMonth = await User.countDocuments({
      createdAt: { $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1) },
      role: { $in: ["user","member"] },
    });

    return NextResponse.json({
      success: true,
      analytics: {
        trend,        // daily array [{date, count, revenue}]
        byType,       // [{_id: "OPD", count, revenue}]
        byStatus,     // [{_id: "pending", count}]
        newUsers,     // weekly new users
        summary: {
          totalRevenuePaid:    totalRevenuePaid[0]?.total || 0,
          bookingsThisMonth:   totalBookingsThisMonth,
          usersThisMonth:      totalUsersThisMonth,
        },
      },
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
