import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking   from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — staff's own collection stats
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["staff", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const range    = searchParams.get("range") || "today"; // today | week | month | all
    const staffId  = searchParams.get("staffId") || session.userId; // admin can query any staff

    await connectDB();

    const now   = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const weekStart  = new Date(today); weekStart.setDate(weekStart.getDate() - 6);
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const dateFrom = range === "today" ? today
      : range === "week"  ? weekStart
      : range === "month" ? monthStart
      : new Date(0);

    const matchQuery = {
      paymentStatus: "paid",
      collectedAt:   { $gte: dateFrom },
    };
    // Non-admin staff only sees their own collections
    if (session.role !== "admin" || !searchParams.get("staffId")) {
      matchQuery.collectedBy = session.userId;
    } else {
      matchQuery.collectedBy = staffId;
    }

    const [summary, refundSummary, byType, byMode, recent] = await Promise.all([
      // Gross totals (paid)
      Booking.aggregate([
        { $match: matchQuery },
        { $group: {
            _id:     null,
            total:   { $sum: "$amount" },
            count:   { $sum: 1 },
            avgAmt:  { $avg: "$amount" },
        }},
      ]),

      // Refunded totals
      Booking.aggregate([
        { $match: { paymentStatus: "refunded", collectedAt: { $gte: dateFrom } } },
        { $group: { _id: null, refunds: { $sum: "$amount" } } },
      ]),

      // By booking type
      Booking.aggregate([
        { $match: matchQuery },
        { $group: {
            _id:   "$type",
            count: { $sum: 1 },
            total: { $sum: "$amount" },
        }},
        { $sort: { total: -1 } },
      ]),

      // By payment mode
      Booking.aggregate([
        { $match: matchQuery },
        { $group: {
            _id:   "$paymentMode",
            count: { $sum: 1 },
            total: { $sum: "$amount" },
        }},
        { $sort: { total: -1 } },
      ]),

      // Recent 20 collections
      Booking.find(matchQuery)
        .sort({ collectedAt: -1 })
        .limit(20)
        .select("bookingId type amount paymentMode collectedAt collectedByName notes status")
        .lean(),
    ]);

    // Parse patient names from notes
    const enriched = recent.map((b) => {
      let n = {};
      try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return { ...b, patientName: n.patientName || "—" };
    });

    const gross   = summary[0]?.total    || 0;
    const refunds = refundSummary[0]?.refunds || 0;

    return NextResponse.json({
      success: true,
      summary: {
        total:   gross,
        refunds: refunds,
        net:     gross - refunds,
        count:   summary[0]?.count || 0,
        avgAmt:  Math.round(summary[0]?.avgAmt || 0),
      },
      byType,
      byMode,
      recent: enriched,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
