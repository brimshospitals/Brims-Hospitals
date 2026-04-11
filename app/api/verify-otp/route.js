import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Doctor from "../../../models/Doctor";
import Hospital from "../../../models/Hospital";
import { createSession } from "../../../lib/auth";
import { resetOtpLimit, resetVerifyLimit, checkVerifyLimit, recordFailedVerify } from "../../../lib/rateLimit";

export const dynamic = "force-dynamic";

function isEmail(str) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(str.trim());
}

const ROLE_REDIRECT = {
  admin:    "/admin",
  staff:    "/staff-dashboard",
  doctor:   "/doctor-dashboard",
  hospital: "/hospital-dashboard",
  user:     "/dashboard",
  member:   "/dashboard",
};

export async function POST(request) {
  try {
    const { identifier, otp } = await request.json();

    if (!identifier || !otp) {
      return NextResponse.json(
        { success: false, message: "Identifier aur OTP dono chahiye" },
        { status: 400 }
      );
    }

    const cleaned   = identifier.trim().toLowerCase();
    const emailMode = isEmail(cleaned);

    // ── Brute-force protection: check verify attempt limit ──────────────────
    const limitCheck = checkVerifyLimit(cleaned);
    if (!limitCheck.allowed) {
      return NextResponse.json(
        { success: false, message: limitCheck.message },
        { status: 429 }
      );
    }

    await connectDB();

    const user = await User.findOne(
      emailMode ? { email: cleaned } : { mobile: cleaned }
    );

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Account nahi mila. Pehle register karein." },
        { status: 404 }
      );
    }

    // ── Wrong OTP ────────────────────────────────────────────────────────────
    if (user.otp !== otp) {
      recordFailedVerify(cleaned); // track failed attempt
      return NextResponse.json(
        { success: false, message: "Galat OTP hai" },
        { status: 400 }
      );
    }

    // ── Expired OTP ──────────────────────────────────────────────────────────
    if (!user.otpExpiry || new Date() > user.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP expire ho gaya. Dobara bhejein." },
        { status: 400 }
      );
    }

    // ── OTP correct — clear it from DB ───────────────────────────────────────
    user.otp       = null;
    user.otpExpiry = null;
    await user.save();

    // Reset rate limits on success
    resetOtpLimit(cleaned);
    resetVerifyLimit(cleaned);

    const role      = user.role || "user";
    const isNewUser = role === "user" && (user.age === 0 || user.name === "New User");
    const redirect  = ROLE_REDIRECT[role] || "/dashboard";

    // ── Fetch linked entity data ──────────────────────────────────────────────
    let extraData = {};

    if (role === "doctor") {
      const doctor = await Doctor.findOne({ userId: user._id }).select(
        "_id name department speciality photo hospitalId hospitalName opdFee"
      );
      if (doctor) {
        extraData = {
          doctorId:     doctor._id.toString(),
          doctorName:   doctor.name,
          department:   doctor.department,
          speciality:   doctor.speciality,
          photo:        doctor.photo || "",
          hospitalId:   doctor.hospitalId?.toString() || "",
          hospitalName: doctor.hospitalName || "",
        };
      }
    }

    if (role === "hospital") {
      const hospital = await Hospital.findOne({ userId: user._id }).select(
        "_id hospitalId name address.district isVerified isActive"
      );
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

    // ── Create httpOnly session cookie ────────────────────────────────────────
    await createSession({
      userId:   user._id.toString(),
      role,
      name:     user.name,
      mobile:   user.mobile || "",
      // Include entity-specific IDs in token too
      ...(extraData.doctorId       && { doctorId:       extraData.doctorId }),
      ...(extraData.hospitalMongoId && { hospitalMongoId: extraData.hospitalMongoId }),
    });

    return NextResponse.json({
      success:  true,
      message:  `Login successful! Welcome back, ${user.name}.`,
      userId:   user._id.toString(),
      name:     user.name,
      mobile:   user.mobile,
      email:    user.email || "",
      role,
      redirect: isNewUser ? "/update-profile" : redirect,
      isNewUser,
      ...extraData,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error. Dobara try karein." }, // Don't expose error.message in prod
      { status: 500 }
    );
  }
}
