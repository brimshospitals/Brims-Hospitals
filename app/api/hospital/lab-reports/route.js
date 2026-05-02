import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabReport   from "../../../../models/LabReport";
import Hospital    from "../../../../models/Hospital";
import LabSettings from "../../../../models/LabSettings";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// Race-condition-safe ID generator with E11000 retry handled at call site
async function genReportId() {
  const last = await LabReport.findOne({}, { reportId: 1 }).sort({ createdAt: -1 }).lean();
  if (!last?.reportId) return "LR-00001";
  const m   = last.reportId.match(/^LR-(\d+)$/);
  const num = m ? parseInt(m[1], 10) : 0;
  return `LR-${String(num + 1).padStart(5, "0")}`;
}

// GET — list reports OR single report (open for print page, no auth required for single reportId)
export async function GET(request) {
  const { searchParams } = new URL(request.url);
  const hospitalId = searchParams.get("hospitalId");
  const reportId   = searchParams.get("reportId");

  await connectDB();

  // Single report fetch (used by print page — no auth, reportId acts as token)
  if (reportId) {
    const report = await LabReport.findOne({ reportId, isActive: true }).lean();
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });

    const [hospital, labSettings] = await Promise.all([
      Hospital.findById(report.hospitalId)
        .select("name address mobile email website photos")
        .lean(),
      LabSettings.findOne({ hospitalId: report.hospitalId }).lean(),
    ]);

    return NextResponse.json({ success: true, report, hospital, labSettings });
  }

  // List reports — requires hospital access
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  const hId = session.role === "admin" ? hospitalId : session.hospitalMongoId;
  if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

  let page  = parseInt(searchParams.get("page")  || "1", 10);
  let limit = parseInt(searchParams.get("limit") || "20", 10);
  if (isNaN(page)  || page  < 1) page  = 1;
  if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

  const status = searchParams.get("status") || "";
  const search = searchParams.get("search") || "";

  const q = { hospitalId: hId, isActive: true };
  if (status) q.status = status;
  if (search.trim()) {
    const esc = escapeRegex(search.trim());
    q.$or = [
      { patientName:  { $regex: esc, $options: "i" } },
      { reportId:     { $regex: esc, $options: "i" } },
      { templateName: { $regex: esc, $options: "i" } },
      { patientMobile:{ $regex: esc, $options: "i" } },
    ];
  }

  const [reports, total] = await Promise.all([
    LabReport.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
    LabReport.countDocuments(q),
  ]);

  return NextResponse.json({ success: true, reports, total, page, pages: Math.ceil(total / limit) });
}

// POST — create lab report
export async function POST(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    await connectDB();

    const body = await request.json();
    const {
      templateId, templateName, category, sampleType, referredBy,
      patientName, patientAge, patientGender, patientMobile, patientRefId,
      results, technicianName, doctorName, labName,
      collectionDate, reportDate, status, bookingId, hospitalId,
    } = body;

    if (!patientName?.trim() || !templateName?.trim()) {
      return NextResponse.json({ success: false, message: "Patient naam aur template zaruri hai" }, { status: 400 });
    }

    const hId = session.role === "admin" ? hospitalId : session.hospitalMongoId;
    if (!hId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const hospital     = await Hospital.findById(hId).select("name").lean();
    let   report       = null;
    let   attempts     = 0;

    while (attempts < 3) {
      try {
        const reportIdStr = await genReportId();
        report = await LabReport.create({
          reportId:      reportIdStr,
          hospitalId:    hId,
          hospitalName:  hospital?.name || "",
          bookingId:     bookingId     || undefined,
          templateId:    templateId    || undefined,
          templateName,
          category:       category    || "Blood Test",
          sampleType:     sampleType  || "Blood",
          referredBy:     referredBy  || "",
          patientName:    patientName.trim(),
          patientAge, patientGender, patientMobile, patientRefId,
          results:        results     || [],
          technicianName: technicianName || "",
          doctorName:     doctorName     || "",
          labName:        labName        || "",
          collectionDate: collectionDate ? new Date(collectionDate) : new Date(),
          reportDate:     reportDate     ? new Date(reportDate)     : new Date(),
          status:         status         || "draft",
        });
        break;
      } catch (e) {
        if (e.code === 11000 && attempts < 2) { attempts++; continue; }
        throw e;
      }
    }

    return NextResponse.json({ success: true, report, message: "Report create ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — update report fields
export async function PATCH(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    await connectDB();

    const { id, ...fields } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    const allowed = [
      "results", "status", "technicianName", "doctorName", "labName",
      "collectionDate", "reportDate", "sampleType", "referredBy",
      "patientName", "patientAge", "patientGender", "patientMobile", "patientRefId",
      "sampleStatus", "sampleReceivedAt", "sampleReceivedBy", "sampleBarcode",
      "isActive",
    ];
    const update = {};
    allowed.forEach((k) => { if (fields[k] !== undefined) update[k] = fields[k]; });

    const report = await LabReport.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });

    return NextResponse.json({ success: true, report, message: "Report update ho gaya!" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
