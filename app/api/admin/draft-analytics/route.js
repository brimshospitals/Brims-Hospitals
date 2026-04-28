import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import BookingDraft from "../../../../models/BookingDraft";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    const now = new Date();
    const todayStart = new Date(now);
    todayStart.setHours(0, 0, 0, 0);
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);

    const [total, totalActive, totalConverted, totalExpired] = await Promise.all([
      BookingDraft.countDocuments(),
      BookingDraft.countDocuments({ status: "active" }),
      BookingDraft.countDocuments({ status: "converted" }),
      BookingDraft.countDocuments({ status: "expired" }),
    ]);

    const conversionRate = total > 0 ? Math.round((totalConverted / total) * 100) : 0;

    // Active drafts older than 30 min today = likely abandoned
    const abandonedToday = await BookingDraft.countDocuments({
      status: "active",
      createdAt: {
        $gte: todayStart,
        $lte: new Date(now.getTime() - 30 * 60 * 1000),
      },
    });

    // Funnel: max stage reached per draft (all-time)
    const stageAgg = await BookingDraft.aggregate([
      { $group: { _id: "$stage", count: { $sum: 1 } } },
      { $sort: { _id: 1 } },
    ]);

    const stage1Count = stageAgg.find((d) => d._id === 1)?.count || 1;
    const byStage = [1, 2, 3, 4].map((stage) => {
      const found = stageAgg.find((d) => d._id === stage);
      const count = found?.count || 0;
      return {
        stage,
        label: ["Item Selected", "Patient Selected", "Slot Selected", "Payment Mode"][stage - 1],
        count,
        pct: Math.round((count / stage1Count) * 100),
        dropOff: stage === 1 ? 0 : Math.max(0, (stageAgg.find((d) => d._id === stage - 1)?.count || 0) - count),
      };
    });

    // By booking type
    const typeAgg = await BookingDraft.aggregate([
      {
        $group: {
          _id: { type: "$type", status: "$status" },
          count: { $sum: 1 },
        },
      },
    ]);

    const typeMap = {};
    for (const d of typeAgg) {
      const { type, status } = d._id;
      if (!typeMap[type]) typeMap[type] = { type, total: 0, converted: 0, active: 0, expired: 0 };
      typeMap[type].total    += d.count;
      if (status === "converted") typeMap[type].converted += d.count;
      if (status === "active")    typeMap[type].active    += d.count;
      if (status === "expired")   typeMap[type].expired   += d.count;
    }

    const byType = Object.values(typeMap).map((t) => ({
      ...t,
      conversionRate: t.total > 0 ? Math.round((t.converted / t.total) * 100) : 0,
    }));

    // 7-day daily trend
    const trendAgg = await BookingDraft.aggregate([
      { $match: { createdAt: { $gte: sevenDaysAgo } } },
      {
        $group: {
          _id: {
            $dateToString: {
              format: "%Y-%m-%d",
              date: "$createdAt",
              timezone: "Asia/Kolkata",
            },
          },
          newDrafts: { $sum: 1 },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { _id: 1 } },
    ]);

    return NextResponse.json({
      success: true,
      data: {
        total,
        totalActive,
        totalConverted,
        totalExpired,
        conversionRate,
        abandonedToday,
        byStage,
        byType,
        trend: trendAgg,
      },
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
