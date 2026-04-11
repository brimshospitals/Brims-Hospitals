import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Booking from "../../../models/Booking";
import Doctor from "../../../models/Doctor";
import SurgeryPackage from "../../../models/SurgeryPackage";
import LabTest from "../../../models/LabTest";
import FamilyCard from "../../../models/FamilyCard";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    const type = searchParams.get("type") || "";
    const status = searchParams.get("status") || "";

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    // Family card mein sare members ke bookings bhi laao
    const user = await User.findById(userId);
    const memberIds = [userId];

    if (user?.familyCardId) {
      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (familyCard?.members?.length) {
        familyCard.members.forEach((id) => memberIds.push(id.toString()));
      }
    }

    const query = { userId: { $in: memberIds } };
    if (type) query.type = type;
    if (status) query.status = status;

    const bookings = await Booking.find(query).sort({ createdAt: -1 }).lean();

    // Populate related data for each booking
    const enriched = await Promise.all(
      bookings.map(async (b) => {
        let extra = {};

        if (b.type === "OPD" && b.doctorId) {
          const doc = await Doctor.findById(b.doctorId)
            .select("name speciality hospitalName photo")
            .lean();
          if (doc) extra = { doctorName: doc.name, speciality: doc.speciality, doctorPhoto: doc.photo, hospitalName: doc.hospitalName };
        }

        if (b.type === "Surgery" && b.packageId) {
          const pkg = await SurgeryPackage.findById(b.packageId)
            .select("name category hospitalName")
            .lean();
          if (pkg) extra = { packageName: pkg.name, category: pkg.category, hospitalName: pkg.hospitalName };
        }

        if (b.type === "Lab" && b.labTestId) {
          const test = await LabTest.findById(b.labTestId)
            .select("name category hospitalName")
            .lean();
          if (test) extra = { testName: test.name, category: test.category, hospitalName: test.hospitalName };
        }

        return { ...b, ...extra };
      })
    );

    // Summary counts
    const summary = {
      total: enriched.length,
      pending: enriched.filter((b) => b.status === "pending").length,
      confirmed: enriched.filter((b) => b.status === "confirmed").length,
      completed: enriched.filter((b) => b.status === "completed").length,
      cancelled: enriched.filter((b) => b.status === "cancelled").length,
    };

    return NextResponse.json({ success: true, bookings: enriched, summary });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
