import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, ["hospital", "admin", "staff"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = session.role === "admin"
      ? searchParams.get("hospitalId")
      : session.hospitalMongoId || searchParams.get("hospitalId");

    if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const dateFilter = searchParams.get("date") || "all";   // today | all
    const status     = searchParams.get("status") || "all";  // pending|confirmed|completed|cancelled|all
    const type       = searchParams.get("type")   || "all";  // OPD|Lab|Surgery|Consultation|IPD|all
    const page       = parseInt(searchParams.get("page") || "1");
    const limit      = 20;

    await connectDB();

    const query = { hospitalId };

    if (status !== "all")   query.status = status;
    if (type   !== "all")   query.type   = type;

    if (dateFilter === "today") {
      const start = new Date(); start.setHours(0,0,0,0);
      const end   = new Date(); end.setHours(23,59,59,999);
      query.appointmentDate = { $gte: start, $lte: end };
    }

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctorId", "name department")
      .lean();

    // Parse notes for each booking
    const enriched = bookings.map((b) => {
      let n = {};
      try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      return { ...b, parsedNotes: n };
    });

    // Accounting summary (all time for this hospital)
    const [paidAgg, pendingAgg, todayAgg] = await Promise.all([
      Booking.aggregate([
        { $match: { hospitalId: require("mongoose").Types.ObjectId.createFromHexString(hospitalId), paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.aggregate([
        { $match: { hospitalId: require("mongoose").Types.ObjectId.createFromHexString(hospitalId), status: { $in: ["pending","confirmed"] } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            hospitalId: require("mongoose").Types.ObjectId.createFromHexString(hospitalId),
            appointmentDate: {
              $gte: new Date(new Date().setHours(0,0,0,0)),
              $lte: new Date(new Date().setHours(23,59,59,999)),
            },
          },
        },
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const accounting = {
      totalRevenue:    paidAgg[0]?.total || 0,
      pendingCount:    pendingAgg[0]?.count || 0,
      todayByStatus:   Object.fromEntries(todayAgg.map((a) => [a._id, a.count])),
    };

    return NextResponse.json({ success: true, bookings: enriched, total, page, pages: Math.ceil(total / limit), accounting });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["hospital", "admin", "staff"]);
  if (error) return error;

  try {
    const { bookingId, status, paymentStatus, notes } = await request.json();
    if (!bookingId) return NextResponse.json({ success: false, message: "bookingId required" }, { status: 400 });

    await connectDB();

    const update = {};
    if (status        !== undefined) update.status        = status;
    if (paymentStatus !== undefined) update.paymentStatus = paymentStatus;
    if (notes         !== undefined) update.notes         = notes;

    const booking = await Booking.findByIdAndUpdate(bookingId, { $set: update }, { new: true }).lean();
    if (!booking) return NextResponse.json({ success: false, message: "Booking not found" }, { status: 404 });

    return NextResponse.json({ success: true, booking });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}