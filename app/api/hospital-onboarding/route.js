import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Hospital from "../../../models/Hospital";
import User from "../../../models/User";
import CommissionSlab from "../../../models/CommissionSlab";
import Notification from "../../../models/Notification";
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

    // Email format validation
    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      return NextResponse.json(
        { success: false, message: "Valid email address daalo" },
        { status: 400 }
      );
    }

    // SPOC email validation
    if (spocEmail && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(spocEmail.trim())) {
      return NextResponse.json(
        { success: false, message: "Valid SPOC email address daalo" },
        { status: 400 }
      );
    }

    // Website URL validation
    if (website && !/^https?:\/\/.+\..+/.test(website.trim())) {
      return NextResponse.json(
        { success: false, message: "Valid website URL daalo (https://example.com)" },
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
      website:  website?.trim() || null,
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

    // I2: notify all admins about new hospital application
    try {
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      if (admins.length > 0) {
        await Notification.insertMany(admins.map((a) => ({
          userId:  a._id,
          type:    "system",
          title:   "Naya Hospital Application 🏥",
          message: `${name} (${district}) ne Brims Health Network join karne ke liye apply kiya hai. Hospital ID: ${hospitalId}. Review karein.`,
        })));
      }
    } catch {}

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