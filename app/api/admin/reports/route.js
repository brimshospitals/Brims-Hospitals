import { NextResponse } from "next/server";
import connectDB  from "../../../../lib/mongodb";
import Booking    from "../../../../models/Booking";
import User       from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// ── Helpers ───────────────────────────────────────────────────────────────────
function startOf(year, month) {
  return new Date(year, month - 1, 1);
}
function endOf(year, month) {
  return new Date(year, month, 0, 23, 59, 59, 999);
}
function isoDate(d) {
  return d.toISOString().split("T")[0];
}

// GET — Revenue & booking reports
// ?period=monthly&year=2025       → monthly breakdown for a year
// ?period=weekly&year=2025&month=4 → weekly breakdown for a month
// ?period=daily&year=2025&month=4  → daily breakdown for a month
// ?export=csv&...                  → returns CSV file download
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const period   = searchParams.get("period")  || "monthly";
    const year     = parseInt(searchParams.get("year")  || new Date().getFullYear());
    const month    = parseInt(searchParams.get("month") || new Date().getMonth() + 1);
    const doExport = searchParams.get("export") === "csv";

    await connectDB();

    let rows = [];
    let title = "";

    if (period === "monthly") {
      // ── Monthly breakdown for full year ──
      title = `Monthly Revenue Report — ${year}`;
      const from = new Date(year, 0, 1);
      const to   = new Date(year, 11, 31, 23, 59, 59, 999);

      const agg = await Booking.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: {
              month: { $month: "$createdAt" },
              type:  "$type",
              paymentStatus: "$paymentStatus",
            },
            count:   { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.month": 1 } },
      ]);

      // Build month rows
      const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
      rows = MONTHS.map((label, i) => {
        const m      = i + 1;
        const items  = agg.filter((x) => x._id.month === m);
        const total  = items.reduce((s, x) => s + x.count, 0);
        const revenue= items.reduce((s, x) => s + x.revenue, 0);
        const paid   = items.filter((x) => x._id.paymentStatus === "paid").reduce((s, x) => s + x.revenue, 0);
        const byType = {};
        items.forEach((x) => { byType[x._id.type] = (byType[x._id.type] || 0) + x.count; });
        return { period: label, total, revenue, paid, ...byType };
      });

    } else if (period === "weekly") {
      // ── Weekly breakdown for a month ──
      title = `Weekly Revenue — ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long" })} ${year}`;
      const from = startOf(year, month);
      const to   = endOf(year, month);

      const agg = await Booking.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { week: { $isoWeek: "$createdAt" }, paymentStatus: "$paymentStatus", type: "$type" },
            count:   { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.week": 1 } },
      ]);

      const weeks = [...new Set(agg.map((x) => x._id.week))].sort((a, b) => a - b);
      rows = weeks.map((w, i) => {
        const items  = agg.filter((x) => x._id.week === w);
        const total  = items.reduce((s, x) => s + x.count, 0);
        const revenue= items.reduce((s, x) => s + x.revenue, 0);
        const paid   = items.filter((x) => x._id.paymentStatus === "paid").reduce((s, x) => s + x.revenue, 0);
        const byType = {};
        items.forEach((x) => { byType[x._id.type] = (byType[x._id.type] || 0) + x.count; });
        return { period: `Week ${i + 1}`, total, revenue, paid, ...byType };
      });

    } else {
      // ── Daily breakdown for a month ──
      title = `Daily Revenue — ${new Date(year, month - 1).toLocaleString("en-IN", { month: "long" })} ${year}`;
      const from = startOf(year, month);
      const to   = endOf(year, month);
      const days = new Date(year, month, 0).getDate();

      const agg = await Booking.aggregate([
        { $match: { createdAt: { $gte: from, $lte: to } } },
        {
          $group: {
            _id: { day: { $dayOfMonth: "$createdAt" }, paymentStatus: "$paymentStatus", type: "$type" },
            count:   { $sum: 1 },
            revenue: { $sum: "$amount" },
          },
        },
        { $sort: { "_id.day": 1 } },
      ]);

      rows = Array.from({ length: days }, (_, i) => {
        const d      = i + 1;
        const items  = agg.filter((x) => x._id.day === d);
        const total  = items.reduce((s, x) => s + x.count, 0);
        const revenue= items.reduce((s, x) => s + x.revenue, 0);
        const paid   = items.filter((x) => x._id.paymentStatus === "paid").reduce((s, x) => s + x.revenue, 0);
        const byType = {};
        items.forEach((x) => { byType[x._id.type] = (byType[x._id.type] || 0) + x.count; });
        return { period: `${d} ${new Date(year, month - 1, d).toLocaleString("en-IN", { month:"short" })}`, total, revenue, paid, ...byType };
      });
    }

    // ── New users same period ──
    const newUsersFrom = period === "monthly"
      ? new Date(year, 0, 1)
      : startOf(year, month);
    const newUsersTo = period === "monthly"
      ? new Date(year, 11, 31, 23, 59, 59)
      : endOf(year, month);

    const userAgg = await User.aggregate([
      { $match: { createdAt: { $gte: newUsersFrom, $lte: newUsersTo }, role: { $in: ["user","member"] } } },
      {
        $group: {
          _id: period === "monthly"
            ? { $month: "$createdAt" }
            : { $dayOfMonth: "$createdAt" },
          count: { $sum: 1 },
        },
      },
    ]);

    // Totals summary
    const summary = {
      totalBookings: rows.reduce((s, r) => s + r.total, 0),
      totalRevenue:  rows.reduce((s, r) => s + r.revenue, 0),
      totalPaid:     rows.reduce((s, r) => s + r.paid, 0),
      newUsers:      userAgg.reduce((s, x) => s + x.count, 0),
    };

    // ── CSV Export ──
    if (doExport) {
      const types = ["OPD","Lab","Surgery","Consultation"];
      const headers = ["Period","Total Bookings","Revenue (₹)","Paid Revenue (₹)", ...types.map((t) => `${t} Count`)];
      const csvRows = [
        headers.join(","),
        ...rows.map((r) =>
          [r.period, r.total, r.revenue, r.paid, ...types.map((t) => r[t] || 0)].join(",")
        ),
        "",
        `Summary,,,,`,
        `Total Bookings,${summary.totalBookings}`,
        `Total Revenue,₹${summary.totalRevenue}`,
        `Paid Revenue,₹${summary.totalPaid}`,
        `New Users,${summary.newUsers}`,
      ];

      const csv = csvRows.join("\n");
      const filename = `brims-report-${period}-${year}${period !== "monthly" ? `-${month}` : ""}.csv`;

      return new NextResponse(csv, {
        status: 200,
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": `attachment; filename="${filename}"`,
        },
      });
    }

    return NextResponse.json({ success: true, title, rows, summary, period, year, month });

  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
