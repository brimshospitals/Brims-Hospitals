import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import Hospital from "../../../../models/Hospital";
import CommissionSlab from "../../../../models/CommissionSlab";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const DEFAULT_COMMISSION = {
  OPD: 10, Lab: 12, Surgery: 8, Consultation: 15, IPD: 8,
};

// Parse paymentMode from booking.notes JSON
function getPayMode(booking) {
  if (booking.paymentMode) return booking.paymentMode;
  try { return JSON.parse(booking.notes || "{}").paymentMode || "counter"; } catch { return "counter"; }
}

// ── GET ────────────────────────────────────────────────────────────────────
// ?period=today | this_month | last_month | custom
// ?from=YYYY-MM-DD &to=YYYY-MM-DD  (when period=custom)
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    await connectDB();
    const { searchParams } = new URL(request.url);
    const period = searchParams.get("period") || "today";

    const now   = new Date();
    let from, to;

    if (period === "today") {
      from = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
      to   = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59, 999);
    } else if (period === "this_month") {
      from = new Date(now.getFullYear(), now.getMonth(), 1);
      to   = new Date(now.getFullYear(), now.getMonth() + 1, 0, 23, 59, 59, 999);
    } else if (period === "last_month") {
      from = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      to   = new Date(now.getFullYear(), now.getMonth(), 0, 23, 59, 59, 999);
    } else {
      from = new Date(searchParams.get("from") || now.toISOString().split("T")[0]);
      to   = new Date(searchParams.get("to")   || now.toISOString().split("T")[0]);
      to.setHours(23, 59, 59, 999);
    }

    // Fetch all bookings in range (not cancelled)
    const bookings = await Booking.find({
      createdAt: { $gte: from, $lte: to },
      status:    { $ne: "cancelled" },
    }).populate("hospitalId", "name address").lean();

    // Fetch commission slabs
    const slabs = await CommissionSlab.find({ isActive: true }).lean();
    const slabMap = {};
    slabs.forEach(s => { slabMap[s.hospitalId?.toString()] = s; });

    // Calculate commission for a booking
    function calcCommission(b) {
      const slab = slabMap[b.hospitalId?.toString()];
      const pct  = (slab?.rates?.[b.type] ?? DEFAULT_COMMISSION[b.type]) ?? 10;
      const comm = Math.round((b.amount || 0) * pct / 100);
      return { pct, comm, hospitalAmt: (b.amount || 0) - comm };
    }

    // ── Aggregate stats ──────────────────────────────────────────
    const totals = { count: 0, revenue: 0, commission: 0, hospitalAmt: 0 };
    const byType         = {};
    const byHospital     = {};
    const byDistrict     = {};
    const byPayMode         = { online: 0, counter: 0, wallet: 0, insurance: 0 };
    const byPayModeRevenue  = { online: 0, counter: 0, wallet: 0, insurance: 0 };

    bookings.forEach(b => {
      const { pct, comm, hospitalAmt } = calcCommission(b);
      const amount = b.amount || 0;

      totals.count++;
      totals.revenue    += amount;
      totals.commission += comm;
      totals.hospitalAmt += hospitalAmt;

      // By type
      if (!byType[b.type]) byType[b.type] = { count: 0, revenue: 0, commission: 0 };
      byType[b.type].count++;
      byType[b.type].revenue    += amount;
      byType[b.type].commission += comm;

      // By hospital
      const hid   = b.hospitalId?._id?.toString() || "direct";
      const hname = b.hospitalId?.name || "Direct / Unknown";
      if (!byHospital[hid]) byHospital[hid] = { name: hname, count: 0, revenue: 0, commission: 0, hospitalAmt: 0 };
      byHospital[hid].count++;
      byHospital[hid].revenue    += amount;
      byHospital[hid].commission += comm;
      byHospital[hid].hospitalAmt += hospitalAmt;

      // By district
      const dist = b.hospitalId?.address?.district || "Unknown";
      if (!byDistrict[dist]) byDistrict[dist] = { count: 0, revenue: 0, commission: 0 };
      byDistrict[dist].count++;
      byDistrict[dist].revenue    += amount;
      byDistrict[dist].commission += comm;

      // By payment mode
      const pm = getPayMode(b);
      if (byPayMode[pm] !== undefined) {
        byPayMode[pm]++;
        byPayModeRevenue[pm] += amount;
      } else {
        byPayMode.counter    = (byPayMode.counter || 0) + 1;
        byPayModeRevenue.counter = (byPayModeRevenue.counter || 0) + amount;
      }
    });

    // Sort by revenue descending
    const hospitalList = Object.entries(byHospital)
      .map(([id, v]) => ({ id, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    const districtList = Object.entries(byDistrict)
      .map(([name, v]) => ({ name, ...v }))
      .sort((a, b) => b.revenue - a.revenue);

    // Payment split: online + wallet come to us; counter = hospital collects
    const toUs = (byPayModeRevenue.online || 0) + (byPayModeRevenue.wallet || 0) + (byPayModeRevenue.insurance || 0);
    const toHospital = byPayModeRevenue.counter || 0;

    return NextResponse.json({
      success: true,
      period,
      from: from.toISOString(),
      to:   to.toISOString(),
      totals,
      byType,
      byHospital: hospitalList,
      byDistrict: districtList,
      byPayMode,
      byPayModeRevenue,
      paymentSplit: { toUs, toHospital },
    });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}