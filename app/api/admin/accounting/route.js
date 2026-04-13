import { NextResponse } from "next/server";
import connectDB    from "../../../../lib/mongodb";
import Booking      from "../../../../models/Booking";
import Hospital     from "../../../../models/Hospital";
import Commission   from "../../../../models/Commission";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// Default commission % per booking type (admin can override per hospital)
const DEFAULT_COMMISSION = {
  OPD:          10,
  Lab:          12,
  Surgery:      8,
  Consultation: 15,
  IPD:          8,
};

// ── GET — Accounting summary + commission list ─────────────────────────────
// ?view=summary          → overall stats + hospital-wise breakdown
// ?view=commissions      → paginated commission records (with filters)
// ?hospitalId=xxx        → filter by hospital
// ?status=pending|paid   → filter payout status
// ?month=4&year=2025     → filter by month
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const view       = searchParams.get("view")       || "summary";
    const hospitalId = searchParams.get("hospitalId") || "";
    const status     = searchParams.get("status")     || "";
    const month      = parseInt(searchParams.get("month") || "0");
    const year       = parseInt(searchParams.get("year")  || new Date().getFullYear());
    const page       = parseInt(searchParams.get("page")  || "1");
    const limit      = 20;

    if (view === "summary") {
      // Overall accounting summary
      const agg = await Commission.aggregate([
        {
          $group: {
            _id: "$payoutStatus",
            count:        { $sum: 1 },
            grossTotal:   { $sum: "$grossAmount" },
            commTotal:    { $sum: "$commissionAmt" },
            hospitalTotal:{ $sum: "$hospitalAmt" },
          },
        },
      ]);

      const summary = { pending: {}, paid: {}, on_hold: {} };
      agg.forEach((x) => { summary[x._id] = x; });

      const totalGross    = agg.reduce((s, x) => s + x.grossTotal,    0);
      const totalComm     = agg.reduce((s, x) => s + x.commTotal,     0);
      const totalHospital = agg.reduce((s, x) => s + x.hospitalTotal, 0);
      const pendingPayout = summary.pending?.hospitalTotal || 0;

      // Hospital-wise breakdown
      const hospitalAgg = await Commission.aggregate([
        {
          $group: {
            _id:          "$hospitalId",
            hospitalName: { $first: "$hospitalName" },
            bookings:     { $sum: 1 },
            gross:        { $sum: "$grossAmount" },
            commission:   { $sum: "$commissionAmt" },
            hospitalAmt:  { $sum: "$hospitalAmt" },
            pendingAmt: {
              $sum: {
                $cond: [{ $eq: ["$payoutStatus", "pending"] }, "$hospitalAmt", 0],
              },
            },
          },
        },
        { $sort: { pendingAmt: -1 } },
        { $limit: 20 },
      ]);

      return NextResponse.json({
        success: true,
        summary: { totalGross, totalComm, totalHospital, pendingPayout },
        byHospital: hospitalAgg,
      });
    }

    // view === "commissions" — paginated list
    const query = {};
    if (hospitalId) query.hospitalId = hospitalId;
    if (status)     query.payoutStatus = status;
    if (month && year) {
      const from = new Date(year, month - 1, 1);
      const to   = new Date(year, month, 0, 23, 59, 59, 999);
      query.createdAt = { $gte: from, $lte: to };
    }

    const [total, rows] = await Promise.all([
      Commission.countDocuments(query),
      Commission.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      commissions: rows,
      total,
      pages: Math.ceil(total / limit),
      page,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── POST — Sync commissions from completed/paid bookings ───────────────────
// Scans bookings not yet in Commission table and creates records.
export async function POST(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();

    // Find all paid/completed bookings with an amount > 0
    const bookings = await Booking.find({
      paymentStatus: "paid",
      amount: { $gt: 0 },
    }).lean();

    // Get already-synced booking IDs
    const existing = await Commission.find({}).select("bookingId").lean();
    const existingSet = new Set(existing.map((c) => c.bookingId.toString()));

    const toCreate = bookings.filter((b) => !existingSet.has(b._id.toString()));

    if (toCreate.length === 0) {
      return NextResponse.json({ success: true, message: "Sab sync hai", synced: 0 });
    }

    // Fetch hospitals for names
    const hospitalIds = [...new Set(toCreate.filter((b) => b.hospitalId).map((b) => b.hospitalId.toString()))];
    const hospitals   = await Hospital.find({ _id: { $in: hospitalIds } }).select("_id name").lean();
    const hospMap     = {};
    hospitals.forEach((h) => { hospMap[h._id.toString()] = h.name; });

    const records = toCreate.map((b) => {
      const pct  = DEFAULT_COMMISSION[b.type] ?? 10;
      const comm = Math.round(b.amount * pct / 100);
      return {
        bookingId:    b._id,
        bookingRef:   b.bookingId,
        hospitalId:   b.hospitalId || undefined,
        hospitalName: b.hospitalId ? (hospMap[b.hospitalId.toString()] || "Unknown") : "Brims Direct",
        doctorId:     b.doctorId   || undefined,
        type:         b.type,
        grossAmount:  b.amount,
        commissionPct:pct,
        commissionAmt:comm,
        hospitalAmt:  b.amount - comm,
        payoutStatus: "pending",
      };
    });

    // Use insertMany with ordered:false to skip duplicates gracefully
    const inserted = await Commission.insertMany(records, { ordered: false }).catch((e) => {
      if (e.code === 11000) return e.result; // partial insert — ignore dup key
      throw e;
    });

    return NextResponse.json({
      success: true,
      message: `${toCreate.length} records sync ho gaye`,
      synced: toCreate.length,
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// ── PATCH — Update payout status ───────────────────────────────────────────
// { ids: [...], payoutStatus: "paid", payoutRef: "UTR12345", payoutDate: "2025-04-01" }
// OR { hospitalId: "xxx", payoutStatus: "paid", payoutRef, payoutDate } → bulk mark all pending for that hospital
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const body = await request.json();
    const { ids, hospitalId, payoutStatus, payoutRef, payoutDate } = body;

    if (!payoutStatus) {
      return NextResponse.json({ success: false, message: "payoutStatus zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const update = {
      payoutStatus,
      ...(payoutRef  && { payoutRef }),
      ...(payoutDate && { payoutDate: new Date(payoutDate) }),
    };

    let result;
    if (ids && ids.length > 0) {
      result = await Commission.updateMany({ _id: { $in: ids } }, update);
    } else if (hospitalId) {
      result = await Commission.updateMany({ hospitalId, payoutStatus: "pending" }, update);
    } else {
      return NextResponse.json({ success: false, message: "ids ya hospitalId zaruri hai" }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      message: `${result.modifiedCount} records update ho gaye`,
      modified: result.modifiedCount,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
