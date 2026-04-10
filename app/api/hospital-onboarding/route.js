import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";

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
    } = body;

    if (!name || !type || !mobile || !district) {
      return NextResponse.json(
        { success: false, message: "Naam, type, mobile aur district zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check duplicate
    const existing = await Hospital.findOne({ mobile });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se hospital registered hai" },
        { status: 400 }
      );
    }

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

    return NextResponse.json({
      success: true,
      message: "Application submit ho gayi! Team jald contact karegi.",
      hospitalId: hospital.hospitalId,
    });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}