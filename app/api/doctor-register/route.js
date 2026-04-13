import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor   from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, mobile, email, department, speciality,
      degrees, experience, hospitalId, hospitalName,
      district, city, opdFee,
    } = body;

    if (!name || !mobile || !department || !opdFee) {
      return NextResponse.json(
        { success: false, message: "Naam, Mobile, Department aur OPD Fee zaruri hai" },
        { status: 400 }
      );
    }

    if (!/^\d{10}$/.test(mobile.trim())) {
      return NextResponse.json(
        { success: false, message: "Valid 10-digit mobile number daalo" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if already applied with this mobile
    const existing = await Doctor.findOne({ mobile: mobile.trim(), userId: null });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Is mobile se pehle se ek application hai. Admin se contact karein." },
        { status: 409 }
      );
    }

    // Resolve hospital name from DB if hospitalId provided (Brims network hospital)
    let resolvedHospitalId  = undefined;
    let resolvedHospitalName = hospitalName?.trim() || "";

    if (hospitalId) {
      const hosp = await Hospital.findById(hospitalId).select("name _id").lean();
      if (hosp) {
        resolvedHospitalId   = hosp._id;
        resolvedHospitalName = hosp.name;
      }
    }

    // Save with isActive: false — admin will review and activate
    const doctor = await Doctor.create({
      name:        name.trim(),
      mobile:      mobile.trim(),
      email:       email?.trim() || "",
      department,
      speciality:  speciality  || "",
      degrees:     degrees     || [],
      experience:  Number(experience) || 0,
      opdFee:      Number(opdFee),
      hospitalId:  resolvedHospitalId,
      hospitalName: resolvedHospitalName,
      address: {
        district: district || "",
        city:     city     || "",
        state:    "Bihar",
      },
      isActive:    false,   // Pending admin approval
      isAvailable: false,
      // userId remains null until admin links a User account
    });

    // Note in console for admin awareness
    console.log(`🩺 New Doctor Registration: ${name} (${mobile}) — pending admin approval. Doctor _id: ${doctor._id}`);

    return NextResponse.json({
      success:  true,
      message:  "Aapki registration request submit ho gayi! Admin approval ke baad login kar sakenge. 2-3 working days mein notification milegi.",
      doctorId: doctor._id.toString(),
    });
  } catch (error) {
    console.error("Doctor Register Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
