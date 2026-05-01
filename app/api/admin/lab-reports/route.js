import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import LabReport from "../../../../models/LabReport";
import Hospital  from "../../../../models/Hospital";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET — list all lab reports across hospitals (admin/staff)
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const reportId   = searchParams.get("reportId");
    const hospitalId = searchParams.get("hospitalId");
    const status     = searchParams.get("status") || "";
    const search     = searchParams.get("search") || "";

    let page  = parseInt(searchParams.get("page")  || "1",  10);
    let limit = parseInt(searchParams.get("limit") || "20", 10);
    if (isNaN(page)  || page  < 1) page  = 1;
    if (isNaN(limit) || limit < 1 || limit > 100) limit = 20;

    // Single report detail
    if (reportId) {
      const report = await LabReport.findOne({ reportId }).lean();
      if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });
      const hospital = await Hospital.findById(report.hospitalId).select("name address mobile").lean();
      return NextResponse.json({ success: true, report, hospital });
    }

    const q = { isActive: true };
    if (hospitalId) q.hospitalId = hospitalId;
    if (status)     q.status     = status;
    if (search.trim()) {
      const esc = escapeRegex(search.trim());
      q.$or = [
        { patientName:  { $regex: esc, $options: "i" } },
        { reportId:     { $regex: esc, $options: "i" } },
        { templateName: { $regex: esc, $options: "i" } },
        { patientMobile:{ $regex: esc, $options: "i" } },
        { hospitalName: { $regex: esc, $options: "i" } },
      ];
    }

    const [reports, total] = await Promise.all([
      LabReport.find(q).sort({ createdAt: -1 }).skip((page - 1) * limit).limit(limit).lean(),
      LabReport.countDocuments(q),
    ]);

    // Attach hospital info per report
    const hospitalIds = [...new Set(reports.map(r => String(r.hospitalId)))];
    const hospitals   = await Hospital.find({ _id: { $in: hospitalIds } }).select("name").lean();
    const hospMap     = Object.fromEntries(hospitals.map(h => [String(h._id), h.name]));
    const enriched    = reports.map(r => ({ ...r, hospitalName: hospMap[String(r.hospitalId)] || r.hospitalName }));

    return NextResponse.json({ success: true, reports: enriched, total, page, pages: Math.ceil(total / limit) });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — admin can update status or soft-delete any report
export async function PATCH(request) {
  const { error } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    await connectDB();
    const { id, status, isActive } = await request.json();
    if (!id) return NextResponse.json({ success: false, message: "id required" }, { status: 400 });

    const update = {};
    if (status   !== undefined) update.status   = status;
    if (isActive !== undefined) update.isActive = isActive;

    const report = await LabReport.findByIdAndUpdate(id, { $set: update }, { new: true }).lean();
    if (!report) return NextResponse.json({ success: false, message: "Report not found" }, { status: 404 });

    return NextResponse.json({ success: true, report });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
