import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { verifyPassword, createSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

const ROLE_REDIRECT = {
  doctor:   "/doctor-dashboard",
  hospital: "/hospital-dashboard",
  staff:    "/staff-dashboard",
  admin:    "/admin",
};

export async function POST(request) {
  try {
    const { identifier, password, expectedRole } = await request.json();

    if (!identifier || !password) {
      return NextResponse.json(
        { success: false, message: "Mobile/Email aur password zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const cleaned   = identifier.trim().toLowerCase();
    const emailMode = isEmail(cleaned);

    // Find user by mobile or email
    const user = await User.findOne(
      emailMode ? { email: cleaned } : { mobile: identifier.trim() }
    ).lean();

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account nahi mila. Pehle admin se register karwayen." },
        { status: 404 }
      );
    }

    // Role check
    const allowedRoles = ["doctor", "hospital", "staff", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json(
        { success: false, message: "Yeh login Doctor/Hospital/Staff ke liye hai" },
        { status: 403 }
      );
    }

    if (expectedRole && user.role !== expectedRole) {
      return NextResponse.json(
        { success: false, message: `Is page par ${expectedRole} login hota hai. Aapka role: ${user.role}` },
        { status: 403 }
      );
    }

    if (!user.isActive) {
      return NextResponse.json(
        { success: false, message: "Account inactive hai. Admin se contact karein." },
        { status: 403 }
      );
    }

    // Check password — try professionalPassword (bcrypt) first, then legacy password field
    let passwordValid = false;
    if (user.professionalPassword) {
      passwordValid = await verifyPassword(password, user.professionalPassword);
    }
    // Also try legacy SHA256 password
    if (!passwordValid && user.password) {
      const { createHash } = await import("crypto");
      const sha256Hash = createHash("sha256")
        .update(password + process.env.JWT_SECRET)
        .digest("hex");
      passwordValid = sha256Hash === user.password;
    }

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: "Password galat hai" },
        { status: 401 }
      );
    }

    // Fetch linked entity for session data
    let extraData = {};

    if (user.role === "doctor") {
      let doctor = await Doctor.findOne({ userId: user._id });
      if (!doctor && user.mobile) {
        doctor = await Doctor.findOne({ mobile: user.mobile, isActive: true });
        if (doctor) {
          await Doctor.findByIdAndUpdate(doctor._id, { userId: user._id });
        }
      }
      if (doctor) {
        extraData = {
          doctorId:     doctor._id.toString(),
          doctorName:   doctor.name,
          department:   doctor.department,
          speciality:   doctor.speciality || "",
          photo:        doctor.photo      || "",
          hospitalId:   doctor.hospitalId?.toString() || "",
          hospitalName: doctor.hospitalName           || "",
        };
      }
    }

    if (user.role === "hospital") {
      let hospital = await Hospital.findOne({ userId: user._id });
      if (!hospital && user.mobile) {
        hospital = await Hospital.findOne({ mobile: user.mobile });
        if (hospital) {
          await Hospital.findByIdAndUpdate(hospital._id, { userId: user._id });
        }
      }
      if (hospital) {
        extraData = {
          hospitalMongoId: hospital._id.toString(),
          hospitalId:      hospital.hospitalId,
          hospitalName:    hospital.name,
          district:        hospital.address?.district || "",
          isVerified:      hospital.isVerified,
          isActive:        hospital.isActive,
        };
      }
    }

    // Create session
    await createSession({
      userId: user._id.toString(),
      role:   user.role,
      name:   user.name,
      mobile: user.mobile || "",
      ...(extraData.doctorId        && { doctorId:        extraData.doctorId }),
      ...(extraData.hospitalMongoId && { hospitalMongoId: extraData.hospitalMongoId }),
    });

    return NextResponse.json({
      success:  true,
      message:  `Welcome, ${user.name}!`,
      userId:   user._id.toString(),
      name:     user.name,
      role:     user.role,
      mobile:   user.mobile  || "",
      email:    user.email   || "",
      redirect: ROLE_REDIRECT[user.role] || "/dashboard",
      ...extraData,
    });

  } catch (err) {
    console.error("Portal Login Error:", err);
    return NextResponse.json(
      { success: false, message: "Server error. Dobara try karein." },
      { status: 500 }
    );
  }
}
