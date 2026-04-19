import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";
import User from "../../../models/User";
import { hashPassword } from "../../../lib/auth";

export const dynamic = "force-dynamic";

function generateHospitalId() {
  return "BRIMS-HOSP-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, type, registrationNo, rohiniNo,
      mobile, email, website,
      street, district, city, pincode,
      spocName, spocContact, spocEmail,
      ownerName, ownerContact,
      departments, specialties,
      password,
    } = body;

    if (!name || !type || !mobile || !district) {
      return NextResponse.json(
        { success: false, message: "Naam, type, mobile aur district zaruri hai" },
        { status: 400 }
      );
    }

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password kam se kam 6 characters ka hona chahiye" },
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

    // Check duplicate hospital
    const existingHosp = await Hospital.findOne({ mobile: mobile.trim() });
    if (existingHosp) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se hospital registered hai" },
        { status: 400 }
      );
    }

    // Check duplicate user with this mobile
    const existingUser = await User.findOne({ mobile: mobile.trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se account hai" },
        { status: 400 }
      );
    }

    const hospitalId = generateHospitalId();

    // Create hospital first
    const hospital = await Hospital.create({
      hospitalId,
      name,
      type,
      registrationNo,
      rohiniNo,
      mobile: mobile.trim(),
      email: email?.trim() || null,
      website,
      address: { street, district, city, pincode, state: "Bihar" },
      spocName,
      spocContact,
      spocEmail: spocEmail?.trim() || null,
      ownerName,
      ownerContact,
      departments: departments || [],
      specialties: specialties || [],
      isVerified: false,
      isActive: false,
    });

    // Create User account — use hospitalId as primary loginId
    const hashedPassword = await hashPassword(password);
    const professionalId = hospitalId; // BRIMS-HOSP-XXXXX is the login ID

    const user = await User.create({
      mobile: mobile.trim(),
      email: email?.trim() || null,
      name: spocName || name,
      age: 30,
      gender: "male",
      role: "hospital",
      hospitalId: hospital._id,
      professionalId,
      professionalPassword: hashedPassword,
      professionalType: "hospital",
      isActive: true,
    });

    // Link user back to hospital
    hospital.userId = user._id;
    await hospital.save();

    console.log(`🏥 New Hospital Registration: ${name} (${mobile}) — Hospital ID: ${hospitalId}`);

    return NextResponse.json({
      success: true,
      message: "Application submit ho gayi! Team jald contact karegi.",
      hospitalId,
      loginId: professionalId,
    });

  } catch (error) {
    console.error("Hospital Onboarding Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}