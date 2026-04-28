import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import Hospital from "../../../../models/Hospital";
import Doctor from "../../../../models/Doctor";
import LabTest from "../../../../models/LabTest";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import Booking from "../../../../models/Booking";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, ["hospital", "admin"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    // Hospital user can only see their own hospital; admin can query any
    const hospitalMongoId = session.role === "admin"
      ? searchParams.get("hospitalId")
      : session.hospitalMongoId || searchParams.get("hospitalId");

    if (!hospitalMongoId) {
      return NextResponse.json({ success: false, message: "hospitalId required" }, { status: 400 });
    }

    await connectDB();

    const hospital = await Hospital.findById(hospitalMongoId).lean();
    if (!hospital) {
      return NextResponse.json({ success: false, message: "Hospital not found" }, { status: 404 });
    }

    const [doctors, labTests, surgeryPackages, totalBookings] = await Promise.all([
      Doctor.find({ hospitalId: hospitalMongoId }).lean(),
      LabTest.find({ hospitalId: hospitalMongoId }).lean(),
      SurgeryPackage.find({ hospitalId: hospitalMongoId }).lean(),
      Booking.countDocuments({ hospitalId: hospitalMongoId }),
    ]);

    return NextResponse.json({
      success: true,
      hospital,
      doctors,
      labTests,
      surgeryPackages,
      stats: {
        // active counts (for public-facing display)
        doctorCount:  doctors.filter((d) => d.isActive !== false).length,
        labTestCount: labTests.filter((t) => t.isActive !== false).length,
        surgeryCount: surgeryPackages.filter((p) => p.isActive !== false).length,
        totalBookings,
        // total counts including inactive (for management tabs)
        totalDoctors:   doctors.length,
        totalLabTests:  labTests.length,
        totalSurgeries: surgeryPackages.length,
      },
    });
  } catch (error) {
    console.error("Hospital Overview Error:", error);
    return NextResponse.json({ success: false, message: "Server error: " + error.message }, { status: 500 });
  }
}
