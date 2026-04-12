import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Booking from "../../../../models/Booking";
import FamilyCard from "../../../../models/FamilyCard";
import Doctor from "../../../../models/Doctor";
import SurgeryPackage from "../../../../models/SurgeryPackage";
import LabTest from "../../../../models/LabTest";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // User profile
    const user = await User.findById(userId)
      .select("-otp -otpExpiry -__v")
      .lean();

    if (!user) {
      return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    }

    // Family card + wallet
    let familyCard = null;
    let familyMembers = [];
    if (user.familyCardId) {
      familyCard = await FamilyCard.findById(user.familyCardId).lean();
      if (familyCard?.members?.length) {
        familyMembers = await User.find({ _id: { $in: familyCard.members } })
          .select("name age gender photo relationship memberId")
          .lean();
      }
    }

    // All bookings for this user
    const bookingsRaw = await Booking.find({ userId })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean();

    const bookings = await Promise.all(
      bookingsRaw.map(async (b) => {
        let extra = {};
        let notes = {};
        try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}

        if (b.type === "OPD" && b.doctorId) {
          const doc = await Doctor.findById(b.doctorId).select("name department photo").lean();
          if (doc) extra = { doctorName: doc.name, department: doc.department, doctorPhoto: doc.photo };
        }
        if (b.type === "Surgery" && b.packageId) {
          const pkg = await SurgeryPackage.findById(b.packageId).select("name category hospitalName").lean();
          if (pkg) extra = { packageName: pkg.name, category: pkg.category, hospitalName: pkg.hospitalName };
        }
        if (b.type === "Lab" && b.labTestId) {
          const test = await LabTest.findById(b.labTestId).select("name category hospitalName").lean();
          if (test) extra = { testName: test.name, category: test.category, hospitalName: test.hospitalName };
        }
        return { ...b, ...notes, ...extra };
      })
    );

    return NextResponse.json({
      success: true,
      user,
      familyCard,
      familyMembers,
      bookings,
      totalBookings: bookingsRaw.length,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
