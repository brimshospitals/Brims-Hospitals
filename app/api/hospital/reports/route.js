import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Report   from "../../../../models/Report";
import User     from "../../../../models/User";
import Hospital from "../../../../models/Hospital";
import { requireHospitalAccess } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET — List reports uploaded by this hospital
export async function GET(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const hospitalId    = session.role === "admin" ? searchParams.get("hospitalId") : session.hospitalMongoId;
    const patientMobile = searchParams.get("mobile") || "";
    const search        = searchParams.get("search") || "";

    if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    await connectDB();

    const query = { hospitalId };

    if (patientMobile) {
      const patient = await User.findOne({ mobile: patientMobile.trim() }).select("_id").lean();
      if (!patient) return NextResponse.json({ success: true, reports: [] });
      query.userId = patient._id;
    }

    if (search.trim()) {
      const esc = escapeRegex(search.trim());
      query.$or = [
        { title:       { $regex: esc, $options: "i" } },
        { patientName: { $regex: esc, $options: "i" } },
        { reportId:    { $regex: esc, $options: "i" } },
      ];
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, reports });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}

// POST — Upload a new report for a patient
export async function POST(request) {
  const { error, session } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const body = await request.json();
    const { patientMobile, title, category, fileUrl, fileType, notes, reportDate, bookingId } = body;

    if (!patientMobile || !title || !fileUrl) {
      return NextResponse.json(
        { success: false, message: "patientMobile, title aur fileUrl zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const hospitalId = session.role === "admin" ? body.hospitalId : session.hospitalMongoId;
    if (!hospitalId) return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });

    const patient = await User.findOne({ mobile: patientMobile.trim() }).select("_id name").lean();
    if (!patient) {
      return NextResponse.json({ success: false, message: "Is mobile se koi patient nahi mila" }, { status: 404 });
    }

    const hospital   = await Hospital.findById(hospitalId).select("name").lean();
    const reportId   = "RPT-" + Date.now().toString(36).toUpperCase();

    const report = await Report.create({
      reportId,
      userId:         patient._id,
      hospitalId,
      bookingId:      bookingId || undefined,
      uploadedByRole: session.role,
      uploadedById:   session.userId,
      title,
      category:       category || "Lab",
      fileUrl,
      fileType:       fileType || "pdf",
      notes:          notes || "",
      reportDate:     reportDate ? new Date(reportDate) : new Date(),
      hospitalName:   hospital?.name || "",
      patientName:    patient.name,
    });

    return NextResponse.json({ success: true, message: "Report upload ho gayi!", report });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}

// DELETE — Soft-delete a report by reportId string
export async function DELETE(request) {
  const { error } = await requireHospitalAccess(request);
  if (error) return error;

  try {
    const { reportId } = await request.json();
    if (!reportId) return NextResponse.json({ success: false, message: "reportId zaruri hai" }, { status: 400 });

    await connectDB();
    const deleted = await Report.findOneAndDelete({ reportId });
    if (!deleted) return NextResponse.json({ success: false, message: "Report nahi mili" }, { status: 404 });

    return NextResponse.json({ success: true, message: "Report delete ho gayi" });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
