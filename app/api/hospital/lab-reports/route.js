import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabReport from "../../../../models/LabReport";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

async function genReportId() {
  const count = await LabReport.countDocuments();
  return `LR-${String(count + 1).padStart(5, "0")}`;
}

// GET — list reports OR single report
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");
  const reportId   = searchParams.get("reportId");

  await connectDB();

  if (reportId) {
    const report = await LabReport.findOne({ reportId, isActive: true }).lean();
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });

    // Also fetch hospital info for print header
    const hospital = await Hospital.findById(report.hospitalId)
      .select("name address mobile email website photos")
      .lean();

    return NextResponse.json({ success: true, report, hospital });
  }

  if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  const page  = parseInt(searchParams.get("page")  || "1");
  const limit = parseInt(searchParams.get("limit") || "20");
  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const q = { hospitalId, isActive: true };
  if (status) q.status = status;
  if (search) q.$or = [
    { patientName: { $regex: search, $options: "i" } },
    { reportId: { $regex: search, $options: "i" } },
    { templateName: { $regex: search, $options: "i" } },
  ];

  const [reports, total] = await Promise.all([
    LabReport.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    LabReport.countDocuments(q),
  ]);

  return NextResponse.json({ success: true, reports, total });
}

// POST — create report
export async function POST(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { templateId, templateName, category, patientName, patientAge, patientGender, patientMobile, patientRefId, results, technicianName, doctorName, labName, collectionDate, reportDate, status, bookingId, hospitalId } = body;

    if (!patientName || !templateName) {
      return NextResponse.json({ success: false, message: "Patient naam aur template zaruri hai" }, { status: 400 });
    }

    const hId = session.role === "admin" ? hospitalId : session.hospitalMongoId;
    if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    await connectDB();

    const hospital = await Hospital.findById(hId).select("name").lean();
    const reportIdStr = await genReportId();

    const report = await LabReport.create({
      reportId: reportIdStr,
      hospitalId: hId,
      hospitalName: hospital?.name || "",
      bookingId: bookingId || undefined,
      templateId: templateId || undefined,
      templateName,
      category: category || "Blood Test",
      patientName, patientAge, patientGender, patientMobile, patientRefId,
      results: results || [],
      technicianName: technicianName || "",
      doctorName: doctorName || "",
      labName: labName || "",
      collectionDate: collectionDate ? new Date(collectionDate) : new Date(),
      reportDate: reportDate ? new Date(reportDate) : new Date(),
      status: status || "draft",
    });

    return NextResponse.json({ success: true, report, message: "Report create ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — update report
export async function PATCH(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    await connectDB();

    const allowed = ["results", "status", "technicianName", "doctorName", "labName", "collectionDate", "reportDate", "patientName", "patientAge", "patientGender", "patientMobile", "isActive"];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const report = await LabReport.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });

    return NextResponse.json({ success: true, report, message: "Report update ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}