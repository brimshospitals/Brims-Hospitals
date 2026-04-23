import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import Doctor   from "../../../models/Doctor";
import User from "../../../models/User";
import Hospital from "../../../models/Hospital";
import { hashPassword } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function generateDoctorId() {
  // Format: BRIMS-DR-XXXX (4 uppercase alphanumeric, unique)
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for (let attempts = 0; attempts < 10; attempts++) {
    const suffix = Array.from({ length: 4 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    const id = `BRIMS-DR-${suffix}`;
    const exists = await Doctor.findOne({ doctorId: id }).lean();
    if (!exists) return id;
  }
  // Fallback: timestamp-based
  return "BRIMS-DR-" + Date.now().toString(36).toUpperCase().slice(-4);
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      name, mobile, email, department, speciality,
      degrees, experience, hospitalId, hospitalName,
      district, city, address, opdFee, offerFee, registrationNumber, password,
      collegeUG, collegePG, collegeMCH, about, photo,
      availableSlots, onlineAvailable, onlineFee, onlineSlots,
      previousExperience, awards,
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

    if (!password || password.length < 6) {
      return NextResponse.json(
        { success: false, message: "Password kam se kam 6 characters ka hona chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if already applied with this mobile
    const existing = await Doctor.findOne({ mobile: mobile.trim() });
    if (existing) {
      return NextResponse.json(
        { success: false, message: "Is mobile se pehle se ek application hai. Admin se contact karein." },
        { status: 409 }
      );
    }

    // Check duplicate user
    const existingUser = await User.findOne({ mobile: mobile.trim() });
    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se pehle se account hai" },
        { status: 400 }
      );
    }

    // Resolve hospital from DB if hospitalId provided (Brims network hospital)
    let resolvedHospitalId   = undefined;
    let resolvedHospitalName = hospitalName?.trim() || "";

    if (hospitalId) {
      const hosp = await Hospital.findById(hospitalId).select("name _id").lean();
      if (hosp) {
        resolvedHospitalId   = hosp._id;
        resolvedHospitalName = hosp.name;
      }
    }

    // Parse degrees
    let parsedDegrees = [];
    if (Array.isArray(degrees)) {
      parsedDegrees = degrees.map(d => {
        if (typeof d === "string") return { degree: d, university: "", year: null };
        return d;
      });
    } else if (typeof degrees === "string" && degrees.trim()) {
      parsedDegrees = [{ degree: degrees.trim(), university: "", year: null }];
    }

    // Generate unique Doctor ID
    const doctorId = await generateDoctorId();

    // Create User account — doctorId is the primary loginId
    const hashedPassword = await hashPassword(password);
    const professionalId = doctorId; // BRIMS-DR-XXXX

    const user = await User.create({
      mobile: mobile.trim(),
      email: email?.trim() || null,
      name: name.trim(),
      age: 30,
      gender: "male",
      role: "doctor",
      professionalId,
      professionalPassword: hashedPassword,
      professionalType: "doctor",
      isActive: true,
    });

    // Save doctor with complete profile
    const resolvedDistrict = address?.district || district || "";
    const resolvedCity     = address?.city     || city     || "";

    const doctor = await Doctor.create({
      doctorId,
      name:               name.trim(),
      mobile:             mobile.trim(),
      email:              email?.trim()              || "",
      photo:              photo                      || "",
      userId:             user._id,
      department,
      speciality:         speciality                 || "",
      degrees:            parsedDegrees,
      registrationNumber: registrationNumber?.trim() || null,
      collegeUG:          collegeUG?.trim()           || "",
      collegePG:          collegePG?.trim()           || "",
      collegeMCH:         collegeMCH?.trim()          || "",
      about:              about?.trim()               || "",
      profileComplete:    false,
      experience:         Number(experience)          || 0,
      opdFee:             Number(opdFee),
      offerFee:           Number(offerFee)            || Number(opdFee),
      availableSlots:     availableSlots              || [],
      onlineAvailable:    onlineAvailable             || false,
      onlineFee:          onlineFee                   || 0,
      onlineSlots:        onlineSlots                 || [],
      previousExperience: previousExperience          || [],
      awards:             awards                      || [],
      hospitalId:         resolvedHospitalId,
      hospitalName:       resolvedHospitalName,
      address: {
        district: resolvedDistrict,
        city:     resolvedCity,
        state:    "Bihar",
      },
      isActive:    false,
      isAvailable: false,
    });

    // Link doctor back to user
    user.doctorId = doctor._id;
    await user.save();

    console.log(`🩺 New Doctor Registration: ${name} (${mobile}) — Doctor ID: ${doctorId} — pending admin approval`);

    return NextResponse.json({
      success:     true,
      message:     "Aapki registration request submit ho gayi! Admin approval ke baad login kar sakenge.",
      doctorId,
      loginId:     professionalId,
    });
  } catch (error) {
    console.error("Doctor Register Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}