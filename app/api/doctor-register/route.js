import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor from "../../../models/Doctor";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, mobile, email, department, speciality,
      degrees, experience, hospitalName, district, city,
      opdFee, about,
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
      hospitalName: hospitalName || "",
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
