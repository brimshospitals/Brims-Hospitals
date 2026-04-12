import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Report   from "../../../../models/Report";
import User     from "../../../../models/User";
import Hospital from "../../../../models/Hospital";

export const dynamic = "force-dynamic";

// GET — List reports uploaded by this hospital
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const hospitalId = searchParams.get("hospitalId");
    const patientMobile = searchParams.get("mobile");

    if (!hospitalId) {
      return NextResponse.json({ success: false, message: "hospitalId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const query = { hospitalId };

    // Optional: filter by patient mobile
    if (patientMobile) {
      const patient = await User.findOne({ mobile: patientMobile.trim() }).select("_id").lean();
      if (patient) query.userId = patient._id;
      else return NextResponse.json({ success: true, reports: [] });
    }

    const reports = await Report.find(query)
      .sort({ createdAt: -1 })
      .limit(100)
      .lean();

    return NextResponse.json({ success: true, reports });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// POST — Upload a new report for a patient
export async function POST(request) {
  try {
    const body = await request.json();
    const { hospitalId, patientMobile, title, category, fileUrl, fileType, notes, reportDate, bookingId } = body;

    if (!hospitalId || !patientMobile || !title || !fileUrl) {
      return NextResponse.json(
        { success: false, message: "hospitalId, patientMobile, title aur fileUrl zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find patient by mobile
    const patient = await User.findOne({ mobile: patientMobile.trim() }).select("_id name").lean();
    if (!patient) {
      return NextResponse.json(
        { success: false, message: "Is mobile se koi patient nahi mila" },
        { status: 404 }
      );
    }

    // Get hospital name for denormalization
    const hospital = await Hospital.findById(hospitalId).select("name").lean();

    const reportId = "RPT-" + Date.now().toString(36).toUpperCase();

    const report = await Report.create({
      reportId,
      userId:       patient._id,
      hospitalId,
      bookingId:    bookingId || undefined,
      uploadedByRole: "hospital",
      uploadedById: hospitalId,
      title,
      category:     category || "Lab",
      fileUrl,
      fileType:     fileType || "pdf",
      notes:        notes || "",
      reportDate:   reportDate ? new Date(reportDate) : new Date(),
      hospitalName: hospital?.name || "",
      patientName:  patient.name,
    });

    return NextResponse.json({ success: true, message: "Report upload ho gayi!", report });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}

// DELETE — Delete a report
export async function DELETE(request) {
  try {
    const { reportId } = await request.json();
    if (!reportId) {
      return NextResponse.json({ success: false, message: "reportId zaruri hai" }, { status: 400 });
    }
    await connectDB();
    await Report.findByIdAndDelete(reportId);
    return NextResponse.json({ success: true, message: "Report delete ho gayi" });
  } catch (error) {
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
