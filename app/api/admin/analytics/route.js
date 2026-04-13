import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking  from "../../../../models/Booking";
import User     from "../../../../models/User";
import Hospital from "../../../../models/Hospital";
import Doctor   from "../../../../models/Doctor";
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

    // Today's window
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    const todayEnd   = new Date();
    todayEnd.setHours(23, 59, 59, 999);

    // This month window
    const monthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Run all aggregations in parallel
    const [
      dailyBookings,
      byType, byStatus,
      byPaymentMode,
      topHospitals,
      topDoctors,
      todayStats,
      totalRevenuePaid,
      totalBookingsThisMonth,
      totalUsersThisMonth,
      newUsersWeekly,
    ] = await Promise.all([

      // ── 1. Daily trend ─────────────────────────────────────────────────────
      Booking.aggregate([
        { $match: { createdAt: { $gte: since } } },
        { $group: {
            _id:     { year: { $year: "$createdAt" }, month: { $month: "$createdAt" }, day: { $dayOfMonth: "$createdAt" } },
            count:   { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } },
        }},
        { $sort: { "_id.year": 1, "_id.month": 1, "_id.day": 1 } },
      ]),

      // ── 2. By type ──────────────────────────────────────────────────────────
      Booking.aggregate([
        { $group: { _id: "$type", count: { $sum: 1 }, revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } } } },
        { $sort: { count: -1 } },
      ]),

      // ── 3. By status ────────────────────────────────────────────────────────
      Booking.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
        { $sort: { count: -1 } },
      ]),

      // ── 4. By payment mode ──────────────────────────────────────────────────
      Booking.aggregate([
        {
          $addFields: {
            pmRaw: {
              $cond: [
                { $isArray: "$notes" },
                "unknown",
                { $let: {
                    vars: { n: { $cond: [{ $isArray: "$notes" }, {}, "$notes"] } },
                    in: "unknown",
                }}
              ]
            }
          }
        },
        {
          $group: {
            _id:     "$paymentMode",
            count:   { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } },
          }
        },
        { $sort: { count: -1 } },
      ]),

      // ── 5. Top 5 hospitals by booking count ────────────────────────────────
      Booking.aggregate([
        { $match: { hospitalId: { $exists: true, $ne: null } } },
        { $group: {
            _id:     "$hospitalId",
            count:   { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } },
        }},
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "hospitals", localField: "_id", foreignField: "_id", as: "hosp" } },
        { $unwind: { path: "$hosp", preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, revenue: 1, name: { $ifNull: ["$hosp.name","Unknown Hospital"] }, district: "$hosp.address.district" } },
      ]),

      // ── 6. Top 5 doctors by booking count ──────────────────────────────────
      Booking.aggregate([
        { $match: { doctorId: { $exists: true, $ne: null } } },
        { $group: {
            _id:     "$doctorId",
            count:   { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } },
        }},
        { $sort: { count: -1 } },
        { $limit: 5 },
        { $lookup: { from: "doctors", localField: "_id", foreignField: "_id", as: "doc" } },
        { $unwind: { path: "$doc", preserveNullAndEmptyArrays: true } },
        { $project: { count: 1, revenue: 1, name: { $ifNull: ["$doc.name","Unknown"] }, department: "$doc.department", hospitalName: "$doc.hospitalName" } },
      ]),

      // ── 7. Today's stats ────────────────────────────────────────────────────
      Booking.aggregate([
        { $match: { createdAt: { $gte: todayStart, $lte: todayEnd } } },
        { $group: {
            _id:     null,
            count:   { $sum: 1 },
            revenue: { $sum: { $cond: [{ $eq: ["$paymentStatus","paid"] }, "$amount", 0] } },
        }},
      ]),

      // ── 8. All-time paid revenue ────────────────────────────────────────────
      Booking.aggregate([
        { $match: { paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),

      // ── 9. This month bookings ──────────────────────────────────────────────
      Booking.countDocuments({ createdAt: { $gte: monthStart } }),

      // ── 10. This month new users ────────────────────────────────────────────
      User.countDocuments({ createdAt: { $gte: monthStart }, role: { $in: ["user","member"] } }),

      // ── 11. Weekly new users (last 4 weeks) ─────────────────────────────────
      User.aggregate([
        { $match: { createdAt: { $gte: new Date(Date.now() - 28 * 86400000) }, role: { $in: ["user","member"] } } },
        { $group: { _id: { $week: "$createdAt" }, count: { $sum: 1 } } },
        { $sort: { "_id": 1 } },
      ]),
    ]);

    // Fill daily trend gaps
    const dateMap = {};
    for (let i = days - 1; i >= 0; i--) {
      const d   = new Date();
      d.setDate(d.getDate() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;
      dateMap[key] = { date: key, count: 0, revenue: 0 };
    }
    dailyBookings.forEach(({ _id, count, revenue }) => {
      const key = `${_id.year}-${String(_id.month).padStart(2,"0")}-${String(_id.day).padStart(2,"0")}`;
      if (dateMap[key]) { dateMap[key].count = count; dateMap[key].revenue = revenue; }
    });
    const trend = Object.values(dateMap);

    // Today new users
    const todayNewUsers = await User.countDocuments({
      createdAt: { $gte: todayStart, $lte: todayEnd },
      role: { $in: ["user","member"] },
    });

    return NextResponse.json({
      success: true,
      analytics: {
        trend,
        byType,
        byStatus,
        byPaymentMode,
        topHospitals,
        topDoctors,
        newUsers: newUsersWeekly,
        today: {
          bookings:    todayStats[0]?.count   || 0,
          revenue:     todayStats[0]?.revenue || 0,
          newUsers:    todayNewUsers,
        },
        summary: {
          totalRevenuePaid:    totalRevenuePaid[0]?.total || 0,
          bookingsThisMonth:   totalBookingsThisMonth,
          usersThisMonth:      totalUsersThisMonth,
        },
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
