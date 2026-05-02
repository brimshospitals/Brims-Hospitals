/**
 * /api/hospital/lab-queue
 * GET — list of confirmed Lab bookings for a hospital, enriched with their
 *        auto-created LabReport and Invoice status so the lab dashboard can
 *        show the "fill report" queue.
 */
import { NextResponse } from "next/server";
import connectDB   from "../../../../lib/mongodb";
import Booking     from "../../../../models/Booking";
import LabReport   from "../../../../models/LabReport";
import Invoice     from "../../../../models/Invoice";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  const { searchParams } = new URL(request.url);
  const hospitalId = session.role === "admin"
    ? searchParams.get("hospitalId")
    : session.hospitalMongoId;

  if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  const search     = searchParams.get("search") || "";
  const reportFilter = searchParams.get("reportStatus") || ""; // "draft" | "final" | "missing"
  let   page       = parseInt(searchParams.get("page")  || "1",  10);
  let   limit      = parseInt(searchParams.get("limit") || "20", 10);
  if (isNaN(page)  || page  < 1) page  = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

  await connectDB();

  // 1. Find LabReports where sample has been received for this hospital
  const receivedReports = await LabReport.find({
    hospitalId,
    sampleStatus: "received",
    isActive: true,
  }).select("bookingId").lean();

  const receivedRefs = receivedReports.map((r) => r.bookingId).filter(Boolean);

  // 2. Fetch the confirmed Lab bookings for those refs
  const bQuery = {
    hospitalId,
    type: "Lab",
    status: "confirmed",
    bookingId: { $in: receivedRefs },
  };
  if (search.trim()) {
    bQuery.$and = [
      { bookingId: { $in: receivedRefs } },
      { $or: [
        { bookingId: { $regex: search.trim(), $options: "i" } },
        { notes:     { $regex: search.trim(), $options: "i" } },
      ]},
    ];
    delete bQuery.bookingId;
  }

  const [bookings, total] = await Promise.all([
    Booking.find(bQuery)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .lean(),
    Booking.countDocuments(bQuery),
  ]);

  if (bookings.length === 0) {
    return NextResponse.json({ success: true, queue: [], total: 0, page, pages: 0 });
  }

  // 2. Fetch associated LabReports and Invoices in bulk
  const bookingRefs = bookings.map((b) => b.bookingId || b._id.toString());

  const [reports, invoices] = await Promise.all([
    LabReport.find({ bookingId: { $in: bookingRefs }, isActive: true })
      .select("reportId bookingId status templateName collectionDate")
      .lean(),
    Invoice.find({ bookingId: { $in: bookingRefs }, isActive: true })
      .select("invoiceId bookingId status totalAmount paidAmount")
      .lean(),
  ]);

  const reportMap  = {};
  const invoiceMap = {};
  reports.forEach((r)  => { reportMap[r.bookingId]  = r; });
  invoices.forEach((i) => { invoiceMap[i.bookingId] = i; });

  // 3. Enrich bookings
  const queue = bookings.map((b) => {
    let n = {};
    try { n = b.notes ? JSON.parse(b.notes) : {}; } catch {}
    const ref     = b.bookingId || b._id.toString();
    const report  = reportMap[ref]  || null;
    const invoice = invoiceMap[ref] || null;

    return {
      _id:           b._id,
      bookingId:     b.bookingId,
      appointmentDate: b.appointmentDate,
      amount:        b.amount,
      paymentMode:   n.paymentMode || b.paymentMode || "counter",
      patientName:   n.patientName   || "Patient",
      patientMobile: n.patientMobile || "",
      patientAge:    n.patientAge    || "",
      patientGender: n.patientGender || "",
      // Report info
      reportId:      report?.reportId  || null,
      reportStatus:  report?.status    || "missing",
      templateName:  report?.templateName || "",
      // Invoice info
      invoiceId:     invoice?.invoiceId  || null,
      invoiceStatus: invoice?.status     || "missing",
      invoiceTotal:  invoice?.totalAmount || 0,
      invoicePaid:   invoice?.paidAmount  || 0,
    };
  });

  // 4. Optional client-side filter by reportStatus
  const filtered = reportFilter
    ? queue.filter((q) => q.reportStatus === reportFilter)
    : queue;

  return NextResponse.json({
    success: true,
    queue: filtered,
    total,
    page,
    pages: Math.ceil(total / limit),
  });
}
