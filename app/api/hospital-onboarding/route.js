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
      departments,
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

    await connectDB();

    // Check duplicate hospital
    const existingHosp = await Hospital.findOne({ mobile });
    if (existingHosp) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se hospital registered hai" },
        { status: 400 }
      );
    }

    // Check duplicate user with this mobile
    const existingUser = await User.findOne({ mobile });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se account hai" },
        { status: 400 }
      );
    }

    // Create hospital first
    const hospital = await Hospital.create({
      hospitalId: generateHospitalId(),
      name,
      type,
      registrationNo,
      rohiniNo,
      mobile,
      email,
      website,
      address: { street, district, city, pincode, state: "Bihar" },
      spocName,
      spocContact,
      spocEmail,
      ownerName,
      ownerContact,
      departments,
      isVerified: false,
      isActive: false,
    });

    // Create User account with professional login credentials
    const hashedPassword = await hashPassword(password);
    const professionalId = email || `hospital_${mobile}`;

    const user = await User.create({
      mobile,
      email: email || null,
      name: spocName || name,
      age: 30,  // Default
      gender: "male",  // Can be updated later
      role: "hospital",
      hospitalId: hospital._id,
      professionalId: professionalId,
      professionalPassword: hashedPassword,
      professionalType: "hospital",
      isActive: true,
    });

    // Link user back to hospital
    hospital.userId = user._id;
    await hospital.save();

    return NextResponse.json({
      success: true,
      message: "Application submit ho gayi! Team jald contact karegi. Apna password se login kar sakte ho.",
      hospitalId: hospital.hospitalId,
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