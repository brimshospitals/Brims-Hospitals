import { NextResponse } from "next/server";
import mongoose from "mongoose";
import connectDB from "../../../../lib/mongodb";
import Booking from "../../../../models/Booking";
import LabReport from "../../../../models/LabReport";
import Invoice from "../../../../models/Invoice";
import { requireAuth } from "../../../../lib/auth";
import { autoProvisionLabBooking } from "../../../../lib/labWorkflow";

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

    const dateFilter = searchParams.get("date")     || "all";
    const status     = searchParams.get("status")   || "all";
    const type       = searchParams.get("type")     || "all";
    const search     = searchParams.get("search")   || "";    // bookingId or patient mobile
    const doctorId   = searchParams.get("doctorId") || "";    // filter by specific doctor
    const page       = parseInt(searchParams.get("page") || "1");
    const limit      = 20;

    await connectDB();

    const query = { hospitalId };

    if (status !== "all")   query.status = status;
    if (type   !== "all")   query.type   = type;
    if (doctorId)           query.doctorId = doctorId;

    if (dateFilter === "today") {
      const start = new Date(); start.setHours(0,0,0,0);
      const end   = new Date(); end.setHours(23,59,59,999);
      query.appointmentDate = { $gte: start, $lte: end };
    }

    // Search by bookingId or patient mobile (stored in notes JSON)
    if (search.trim()) {
      query.$or = [
        { bookingId: { $regex: search.trim(), $options: "i" } },
        { notes:     { $regex: search.trim(), $options: "i" } },
      ];
    }

    const total    = await Booking.countDocuments(query);
    const bookings = await Booking.find(query)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate("doctorId", "name department")
      .lean();

    // Enrich Lab bookings with their LabReport + Invoice info
    const labBookingRefs = bookings
      .filter((b) => b.type === "Lab")
      .map((b) => b.bookingId || b._id.toString());

    const [labReports, labInvoices] = labBookingRefs.length
      ? await Promise.all([
          LabReport.find({ bookingId: { $in: labBookingRefs }, isActive: true })
            .select("reportId bookingId status sampleStatus sampleReceivedAt sampleReceivedBy sampleBarcode templateName")
            .lean(),
          Invoice.find({ bookingId: { $in: labBookingRefs }, isActive: true })
            .select("invoiceId bookingId status totalAmount paidAmount")
            .lean(),
        ])
      : [[], []];

    const reportMap  = {};
    const invoiceMap = {};
    labReports.forEach((r)  => { reportMap[r.bookingId]  = r; });
    labInvoices.forEach((i) => { invoiceMap[i.bookingId] = i; });

    // Parse notes for each booking
    const enriched = bookings.map((b) => {
      let n = {};
      try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      const ref     = b.bookingId || b._id.toString();
      const labRpt  = b.type === "Lab" ? (reportMap[ref]  || null) : undefined;
      const labInv  = b.type === "Lab" ? (invoiceMap[ref] || null) : undefined;
      return {
        ...b,
        parsedNotes: n,
        ...(labRpt !== undefined && {
          labReport: labRpt ? {
            _id:              labRpt._id,
            reportId:         labRpt.reportId,
            status:           labRpt.status,
            sampleStatus:     labRpt.sampleStatus,
            sampleReceivedAt: labRpt.sampleReceivedAt,
            sampleReceivedBy: labRpt.sampleReceivedBy,
            sampleBarcode:    labRpt.sampleBarcode,
            templateName:     labRpt.templateName,
          } : null,
          labInvoice: labInv ? {
            invoiceId:   labInv.invoiceId,
            status:      labInv.status,
            totalAmount: labInv.totalAmount,
            paidAmount:  labInv.paidAmount,
          } : null,
        }),
      };
    });

    // Accounting summary (all time for this hospital)
    let hObjId;
    try { hObjId = mongoose.Types.ObjectId.createFromHexString(hospitalId); } catch { hObjId = null; }
    if (!hObjId) {
      return NextResponse.json({ success: true, bookings: enriched, total, page, pages: Math.ceil(total / limit), accounting: {} });
    }
    const [paidAgg, pendingAgg, todayAgg] = await Promise.all([
      Booking.aggregate([
        { $match: { hospitalId: hObjId, paymentStatus: "paid" } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
      Booking.aggregate([
        { $match: { hospitalId: hObjId, status: { $in: ["pending","confirmed"] } } },
        { $group: { _id: null, count: { $sum: 1 } } },
      ]),
      Booking.aggregate([
        {
          $match: {
            hospitalId: hObjId,
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

    // Auto-provision LabReport + Invoice when a Lab booking is confirmed
    let labProvision = null;
    if (booking.type === "Lab" && update.status === "confirmed") {
      try { labProvision = await autoProvisionLabBooking(booking); } catch {}
    }

    return NextResponse.json({ success: true, booking, labProvision });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}