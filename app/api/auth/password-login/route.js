import { NextResponse } from "next/server";
import { createHash } from "crypto";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Doctor from "../../../../models/Doctor";
import Hospital from "../../../../models/Hospital";
import { createSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function hashPassword(pw) {
  return createHash("sha256").update(pw + process.env.JWT_SECRET).digest("hex");
}

function isEmail(s) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(s.trim());
}

export async function POST(request) {
  try {
    const { identifier, password } = await request.json();
    if (!identifier || !password) {
      return NextResponse.json({ success: false, message: "Identifier aur password zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Find user by mobile or email
    const query = isEmail(identifier)
      ? { email: identifier.trim().toLowerCase() }
      : { mobile: identifier.trim() };

    const user = await User.findOne(query).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "Account nahi mila. Pehle OTP se login karein." }, { status: 404 });
    }

    // Check role
    const allowedRoles = ["doctor", "hospital", "staff", "admin"];
    if (!allowedRoles.includes(user.role)) {
      return NextResponse.json({ success: false, message: "Password login sirf Doctor/Hospital/Staff ke liye hai" }, { status: 403 });
    }

    // Check password set
    if (!user.password) {
      return NextResponse.json({ success: false, message: "Password set nahi hai. OTP se login karein aur phir password set karein." }, { status: 400 });
    }

    // Verify password
    const hashed = hashPassword(password);
    if (hashed !== user.password) {
      return NextResponse.json({ success: false, message: "Password galat hai" }, { status: 401 });
    }

    if (!user.isActive) {
      return NextResponse.json({ success: false, message: "Account inactive hai. Admin se contact karein." }, { status: 403 });
    }

    // Build session payload
    const payload = {
      userId: user._id.toString(),
      role:   user.role,
      name:   user.name,
      mobile: user.mobile,
    };

    // Fetch linked entity
    let doctorId = null, doctorName = null, hospitalMongoId = null, hospitalId = null, hospitalName = null;

    if (user.role === "doctor") {
      let doc = await Doctor.findOne({ userId: user._id }).lean();
      if (!doc && user.mobile) {
        doc = await Doctor.findOne({ mobile: user.mobile, isActive: true }).lean();
        if (doc) await Doctor.findByIdAndUpdate(doc._id, { userId: user._id });
      }
      if (doc) {
        doctorId   = doc._id.toString();
        doctorName = doc.name;
        hospitalId = doc.hospitalId?.toString() || "";
      }
    }

    if (user.role === "hospital") {
      let hosp = await Hospital.findOne({ userId: user._id }).lean();
      if (!hosp && user.mobile) {
        hosp = await Hospital.findOne({ mobile: user.mobile }).lean();
        if (hosp) await Hospital.findByIdAndUpdate(hosp._id, { userId: user._id });
      }
      if (hosp) {
        hospitalMongoId = hosp._id.toString();
        hospitalId      = hosp.hospitalId || "";
        hospitalName    = hosp.name;
      }
    }

    await createSession(payload);

    return NextResponse.json({
      success: true,
      message: "Login successful",
      role:    user.role,
      name:    user.name,
      userId:  user._id.toString(),
      mobile:  user.mobile,
      doctorId, doctorName, hospitalMongoId, hospitalId, hospitalName,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
