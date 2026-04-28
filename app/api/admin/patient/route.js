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
    if (user.familyCardId) {
      familyCard = await FamilyCard.findById(user.familyCardId).lean();
    }
    // B4: Family members are embedded in user.familyMembers (not a separate collection)
    const familyMembers = user.familyMembers || [];

    // All bookings for this user (last 20 display + real total count)
    const [bookingsRaw, totalBookings] = await Promise.all([
      Booking.find({ userId }).sort({ createdAt: -1 }).limit(20).lean(),
      Booking.countDocuments({ userId }),
    ]);

    // B4: Batch-fetch related docs instead of N+1 individual queries
    const doctorIds  = [...new Set(bookingsRaw.filter(b => b.type === "OPD"     && b.doctorId ).map(b => b.doctorId.toString()))];
    const packageIds = [...new Set(bookingsRaw.filter(b => b.type === "Surgery" && b.packageId).map(b => b.packageId.toString()))];
    const labTestIds = [...new Set(bookingsRaw.filter(b => b.type === "Lab"     && b.labTestId).map(b => b.labTestId.toString()))];

    const [doctors, packages, labTestDocs] = await Promise.all([
      doctorIds.length  ? Doctor.find({ _id: { $in: doctorIds }  }).select("name department photo").lean()          : [],
      packageIds.length ? SurgeryPackage.find({ _id: { $in: packageIds } }).select("name category hospitalName").lean() : [],
      labTestIds.length ? LabTest.find({ _id: { $in: labTestIds } }).select("name category hospitalName").lean()     : [],
    ]);
    const docMap  = {}; doctors.forEach(d   => { docMap[d._id.toString()]  = d; });
    const pkgMap  = {}; packages.forEach(p  => { pkgMap[p._id.toString()]  = p; });
    const testMap = {}; labTestDocs.forEach(t => { testMap[t._id.toString()] = t; });

    const bookings = bookingsRaw.map(b => {
      let extra = {};
      let notes = {};
      try { notes = b.notes ? JSON.parse(b.notes) : {}; } catch {}
      if (b.type === "OPD"     && b.doctorId ) { const d = docMap[b.doctorId.toString()];   if (d) extra = { doctorName: d.name, department: d.department, doctorPhoto: d.photo }; }
      if (b.type === "Surgery" && b.packageId) { const p = pkgMap[b.packageId.toString()];  if (p) extra = { packageName: p.name, category: p.category, hospitalName: p.hospitalName }; }
      if (b.type === "Lab"     && b.labTestId) { const t = testMap[b.labTestId.toString()]; if (t) extra = { testName: t.name, category: t.category, hospitalName: t.hospitalName }; }
      return { ...b, ...notes, ...extra };
    });

    return NextResponse.json({
      success: true,
      user,
      familyCard,
      familyMembers,
      bookings,
      totalBookings,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
