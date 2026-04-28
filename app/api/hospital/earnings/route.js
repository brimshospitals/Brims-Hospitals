import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import Transaction from "../../../../models/Transaction";
import CommissionSlab from "../../../../models/CommissionSlab";
import { requireAuth } from "../../../../lib/auth";
import mongoose from "mongoose";

export const dynamic = "force-dynamic";

const DEFAULT_RATES = { OPD: 10, Lab: 12, Surgery: 8, Consultation: 15, IPD: 8 };

// GET — hospital earnings summary + booking list + payout history
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["hospital", "admin", "staff"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId =
      session.role === "admin" || session.role === "staff"
        ? searchParams.get("hospitalId")
        : session.hospitalMongoId || searchParams.get("hospitalId");

    if (!hospitalId)
      return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const page     = parseInt(searchParams.get("page") || "1");
    const limit    = 20;
    const typeF    = searchParams.get("type") || "all";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo   = searchParams.get("dateTo")   || "";
    const view     = searchParams.get("view")     || "bookings"; // bookings | payouts

    await connectDB();

    const hObjId = mongoose.Types.ObjectId.createFromHexString(hospitalId);

    // ── Commission rates (slab or defaults) ────────────────────────────────────
    const slab = await CommissionSlab.findOne({ hospitalId, isActive: true }).lean();
    const commissionRates = {
      OPD:          slab?.rates?.OPD          ?? DEFAULT_RATES.OPD,
      Lab:          slab?.rates?.Lab          ?? DEFAULT_RATES.Lab,
      Surgery:      slab?.rates?.Surgery      ?? DEFAULT_RATES.Surgery,
      Consultation: slab?.rates?.Consultation ?? DEFAULT_RATES.Consultation,
      IPD:          slab?.rates?.IPD          ?? DEFAULT_RATES.IPD,
    };

    // ── Summary aggregations (all-time, no type/date filter) ──────────────────
    const [onlinePendingAgg, onlinePaidAgg, counterAgg, thisMonthAgg] = await Promise.all([

      // Platform owes hospital — only completed bookings (service delivered + online payment received)
      Booking.aggregate([
        { $match: {
          hospitalId: hObjId,
          status: "completed",
          paymentMode: { $in: ["online", "wallet", "insurance"] },
          $or: [{ payoutStatus: null }, { payoutStatus: "pending" }],
        }},
        { $group: { _id: null, total: { $sum: "$hospitalPayable" }, count: { $sum: 1 } } },
      ]),

      // Already paid out by platform to hospital
      Booking.aggregate([
        { $match: {
          hospitalId: hObjId,
          status: { $in: ["confirmed", "completed"] },
          paymentMode: { $in: ["online", "wallet", "insurance"] },
          payoutStatus: "paid",
        }},
        { $group: { _id: null, total: { $sum: "$hospitalPayable" }, count: { $sum: 1 } } },
      ]),

      // Counter bookings — hospital collected cash, owes platform commission
      Booking.aggregate([
        { $match: {
          hospitalId: hObjId,
          status: { $in: ["confirmed", "completed"] },
          paymentMode: "counter",
        }},
        { $group: {
          _id: null,
          totalCollected:  { $sum: "$amount" },
          totalCommission: { $sum: "$platformCommission" },
          count: { $sum: 1 },
        }},
      ]),

      // This month — total hospitalPayable for completed bookings
      Booking.aggregate([
        { $match: {
          hospitalId: hObjId,
          status: { $in: ["confirmed", "completed"] },
          createdAt: {
            $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
            $lte: new Date(),
          },
        }},
        { $group: { _id: null, total: { $sum: "$hospitalPayable" }, totalCounter: { $sum: { $cond: [{ $eq: ["$paymentMode","counter"] }, "$amount", 0] } } } },
      ]),
    ]);

    const summary = {
      pendingFromPlatform:      onlinePendingAgg[0]?.total  || 0,
      pendingFromPlatformCount: onlinePendingAgg[0]?.count  || 0,
      receivedFromPlatform:     onlinePaidAgg[0]?.total     || 0,
      receivedFromPlatformCount:onlinePaidAgg[0]?.count     || 0,
      counterCollected:         counterAgg[0]?.totalCollected  || 0,
      counterCommissionDue:     counterAgg[0]?.totalCommission || 0,
      counterCount:             counterAgg[0]?.count           || 0,
      thisMonthEarnings:        thisMonthAgg[0]?.total         || 0,
    };

    // ── Payout history view ────────────────────────────────────────────────────
    if (view === "payouts") {
      const paidBookings = await Booking.find({
        hospitalId: hObjId,
        payoutStatus: "paid",
      })
        .sort({ payoutProcessedAt: -1 })
        .limit(50)
        .lean();

      const payoutHistory = paidBookings.map((b) => {
        let n = {};
        try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
        return { ...b, parsedNotes: n };
      });

      return NextResponse.json({ success: true, commissionRates, summary, payouts: payoutHistory });
    }

    // ── Bookings list view ─────────────────────────────────────────────────────
    const query = {
      hospitalId: hObjId,
      status: { $nin: ["cancelled"] },
    };
    if (typeF !== "all") query.type = typeF;
    if (dateFrom) query.createdAt = { ...(query.createdAt || {}), $gte: new Date(dateFrom) };
    if (dateTo)   query.createdAt = { ...(query.createdAt || {}), $lte: new Date(dateTo + "T23:59:59.999Z") };

    const [total, bookings] = await Promise.all([
      Booking.countDocuments(query),
      Booking.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("doctorId", "name department")
        .lean(),
    ]);

    const enriched = bookings.map((b) => {
      let n = {};
      try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      // Backward compat: compute commission if not stored on booking
      const cPct  = b.commissionPct    ?? (commissionRates[b.type] ?? 10);
      const cAmt  = b.platformCommission != null ? b.platformCommission : Math.round((b.amount || 0) * cPct / 100);
      const hPay  = b.hospitalPayable   != null ? b.hospitalPayable   : (b.amount || 0) - cAmt;
      return { ...b, parsedNotes: n, commissionPct: cPct, platformCommission: cAmt, hospitalPayable: hPay };
    });

    return NextResponse.json({
      success: true,
      commissionRates,
      summary,
      bookings: enriched,
      pagination: { total, page, pages: Math.ceil(total / limit), limit },
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
