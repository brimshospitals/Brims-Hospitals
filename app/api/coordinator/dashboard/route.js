import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Coordinator from "../../../../models/Coordinator";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    await connectDB();

    const coord = await Coordinator.findOne({ userId: session.userId }).lean();
    if (!coord) {
      return NextResponse.json({ success: false, message: "Coordinator profile nahi mila" }, { status: 404 });
    }

    const now      = new Date();
    const today    = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1);
    const thisMonth   = new Date(now.getFullYear(), now.getMonth(), 1);
    const sevenDaysAgo = new Date(today); sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);

    // SB1 Fix: All stats via aggregation — no 100-booking cap
    const [earningsAgg = {}] = await Booking.aggregate([
      { $match: { coordinatorId: coord._id } },
      {
        $group: {
          _id: null,
          totalBookings: { $sum: 1 },
          // pendingEarned: commission on active (not completed/cancelled) bookings
          pendingEarned: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$coordinatorPaid", true] },
                  { $not: [{ $in: ["$status", ["completed", "cancelled"]] }] },
                ]},
                { $ifNull: ["$coordinatorCommission", 0] }, 0,
              ],
            },
          },
          // availableEarned: completed but not yet paid out
          availableEarned: {
            $sum: {
              $cond: [
                { $and: [
                  { $ne: ["$coordinatorPaid", true] },
                  { $eq: ["$status", "completed"] },
                ]},
                { $ifNull: ["$coordinatorCommission", 0] }, 0,
              ],
            },
          },
          // paidEarned: already transferred to coordinator
          paidEarned: {
            $sum: {
              $cond: [
                { $eq: ["$coordinatorPaid", true] },
                { $ifNull: ["$coordinatorCommission", 0] }, 0,
              ],
            },
          },
        },
      },
    ]);

    const pendingEarned   = earningsAgg.pendingEarned   || 0;
    const availableEarned = earningsAgg.availableEarned || 0;
    const paidEarned      = earningsAgg.paidEarned      || 0;
    // MB3 Fix: totalEarned includes ALL commissions (pending + available + paid)
    const totalEarned     = pendingEarned + availableEarned + paidEarned;

    // Today / month counts
    const [[todayAgg = {}], [monthAgg = {}]] = await Promise.all([
      Booking.aggregate([
        { $match: { coordinatorId: coord._id, createdAt: { $gte: today, $lt: tomorrow } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        { $match: { coordinatorId: coord._id, createdAt: { $gte: thisMonth } } },
        { $group: {
          _id: null,
          count:  { $sum: 1 },
          earned: { $sum: { $ifNull: ["$coordinatorCommission", 0] } },
        }},
      ]),
    ]);

    // Unique clients (by userId)
    const uniqueClientIds = await Booking.distinct("userId", { coordinatorId: coord._id });

    // Last 7 days trend via aggregation
    const trendRaw = await Booking.aggregate([
      { $match: { coordinatorId: coord._id, createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id:      { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
          bookings: { $sum: 1 },
          earned:   { $sum: { $ifNull: ["$coordinatorCommission", 0] } },
        },
      },
      { $sort: { _id: 1 } },
    ]);
    const trendMap = {};
    trendRaw.forEach(d => { trendMap[d._id] = d; });

    const trend = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = d.toISOString().slice(0, 10);
      trend.push({
        date:     d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" }),
        bookings: trendMap[key]?.bookings || 0,
        earned:   trendMap[key]?.earned   || 0,
      });
    }

    // This month type breakdown via aggregation
    const typeRaw = await Booking.aggregate([
      { $match: { coordinatorId: coord._id, createdAt: { $gte: thisMonth } } },
      { $group: { _id: "$type", earned: { $sum: { $ifNull: ["$coordinatorCommission", 0] } } } },
    ]);
    const typeBreakdown = {};
    typeRaw.forEach(t => { typeBreakdown[t._id] = t.earned; });

    // Recent bookings for display (last 20 only)
    const bookings = await Booking.find({ coordinatorId: coord._id })
      .populate("packageId",  "name mrp offerPrice membershipPrice hospitalName")
      .populate("labTestId",  "name mrp offerPrice membershipPrice hospitalName category")
      .populate("doctorId",   "name department hospitalName opdFee offerFee")
      .populate("hospitalId", "name")
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    return NextResponse.json({
      success: true,
      coordinator: coord,
      stats: {
        totalBookings:  earningsAgg.totalBookings || 0,
        todayBookings:  todayAgg.count  || 0,
        monthBookings:  monthAgg.count  || 0,
        totalClients:   uniqueClientIds.length,
        totalEarned,
        pendingEarned,
        availableEarned,
        paidEarned,
        monthEarned:    monthAgg.earned || 0,
      },
      trend,
      typeBreakdown,
      bookings,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
