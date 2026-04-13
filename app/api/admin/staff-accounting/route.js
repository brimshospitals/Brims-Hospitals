import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking   from "../../../../models/Booking";
import User      from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const range = searchParams.get("range") || "today"; // today | week | month | all

    await connectDB();

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(today); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dateFrom = range === "today" ? today
      : range === "week"  ? weekStart
      : range === "month" ? monthStart
      : new Date(0);

    // ── 1. Per-staff collection summary ────────────────────────────────────────
    const perStaff = await Booking.aggregate([
      {
        $match: {
          paymentStatus: "paid",
          collectedBy:   { $exists: true, $ne: null },
          collectedAt:   { $gte: dateFrom },
        }
      },
      {
        $group: {
          _id:           "$collectedBy",
          staffName:     { $first: "$collectedByName" },
          totalAmount:   { $sum: "$amount" },
          totalBookings: { $sum: 1 },
          lastCollected: { $max: "$collectedAt" },
          byType: { $push: "$type" },
        }
      },
      { $sort: { totalAmount: -1 } },
    ]);

    // Count type breakdown per staff
    const enrichedStaff = perStaff.map((s) => {
      const typeCounts = {};
      (s.byType || []).forEach((t) => { typeCounts[t] = (typeCounts[t] || 0) + 1; });
      return { ...s, typeCounts, byType: undefined };
    });

    // ── 2. Overall totals ───────────────────────────────────────────────────────
    const overallAgg = await Booking.aggregate([
      { $match: { paymentStatus: "paid", collectedAt: { $gte: dateFrom } } },
      { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
    ]);

    // ── 3. Today's hourly breakdown ─────────────────────────────────────────────
    const hourly = await Booking.aggregate([
      { $match: { paymentStatus: "paid", collectedAt: { $gte: today } } },
      {
        $group: {
          _id:   { $hour: "$collectedAt" },
          count: { $sum: 1 },
          total: { $sum: "$amount" },
        }
      },
      { $sort: { _id: 1 } },
    ]);

    // Fill 8am–8pm
    const hourMap = {};
    for (let h = 8; h <= 20; h++) hourMap[h] = { hour: h, count: 0, total: 0 };
    hourly.forEach((h) => { if (hourMap[h._id]) { hourMap[h._id].count = h.count; hourMap[h._id].total = h.total; } });
    const hourlyFilled = Object.values(hourMap);

    // ── 4. All staff names (for filter dropdown) ────────────────────────────────
    const allStaff = await User.find({ role: "staff", isActive: true })
      .select("name mobile _id").lean();

    return NextResponse.json({
      success: true,
      range,
      perStaff:    enrichedStaff,
      overall:     { total: overallAgg[0]?.total || 0, count: overallAgg[0]?.count || 0 },
      hourly:      hourlyFilled,
      allStaff,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
