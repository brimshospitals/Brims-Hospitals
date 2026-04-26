import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Coordinator from "../../../../models/Coordinator";
import Transaction from "../../../../models/Transaction";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — list all primary users registered by this coordinator
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "admin"]);
  if (error) return error;

  try {
    await connectDB();
    const coord = await Coordinator.findOne({ userId: session.userId }).select("_id").lean();
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });

    const users = await User.find({ registeredByCoordinator: coord._id })
      .select("-otp -otpExpiry -password -professionalPassword")
      .populate("familyCardId", "status cardNumber activationDate expiryDate walletBalance")
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({ success: true, families: users, total: users.length });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

export async function POST(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "admin"]);
  if (error) return error;

  const body = await request.json();
  const { action } = body;

  await connectDB();

  // ── action: lookup ────────────────────────────────────────────────────────
  // Check if mobile exists before sending OTP
  if (action === "lookup") {
    const { mobile } = body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile zaruri hai" }, { status: 400 });
    }
    const existing = await User.findOne({ mobile })
      .select("_id name age gender memberId familyCardId familyMembers")
      .populate("familyCardId", "status cardNumber expiryDate")
      .lean();
    if (existing) {
      return NextResponse.json({ success: true, exists: true, user: existing });
    }
    return NextResponse.json({ success: true, exists: false });
  }

  // ── action: send-otp ──────────────────────────────────────────────────────
  if (action === "send-otp") {
    const { mobile } = body;
    if (!mobile || !/^\d{10}$/.test(mobile)) {
      return NextResponse.json({ success: false, message: "Valid 10-digit mobile zaruri hai" }, { status: 400 });
    }

    const otp     = String(Math.floor(100000 + Math.random() * 900000));
    const expiry  = new Date(Date.now() + 10 * 60 * 1000);

    let user = await User.findOne({ mobile });
    if (!user) {
      user = await User.create({ mobile, name: "New User", age: 0, gender: "male", role: "user", otp, otpExpiry: expiry });
    } else {
      user.otp = otp; user.otpExpiry = expiry;
      await user.save();
    }

    // Send SMS
    try {
      if (process.env.FAST2SMS_API_KEY) {
        await fetch(`https://www.fast2sms.com/dev/bulkV2?authorization=${process.env.FAST2SMS_API_KEY}&route=otp&variables_values=${otp}&flash=0&numbers=${mobile}`);
      }
    } catch {}

    const isDev = process.env.NEXT_PUBLIC_SHOW_OTP === "true";
    return NextResponse.json({
      success: true,
      userId: user._id,
      ...(isDev && { otp }),
      message: "OTP bheja gaya",
    });
  }

  // ── action: verify-register ───────────────────────────────────────────────
  // Verify OTP and complete primary registration (no session cookie set)
  if (action === "verify-register") {
    const { mobile, otp, name, age, gender, district, preExistingDiseases, idType, idNumber } = body;
    if (!mobile || !otp || !name || !age || !gender) {
      return NextResponse.json({ success: false, message: "Naam, umar, ling aur OTP zaruri hai" }, { status: 400 });
    }

    const user = await User.findOne({ mobile });
    if (!user) return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    if (!user.otp || user.otp !== otp || new Date() > new Date(user.otpExpiry)) {
      return NextResponse.json({ success: false, message: "OTP galat hai ya expire ho gaya" }, { status: 400 });
    }

    const coord = await Coordinator.findOne({ userId: session.userId });
    if (!coord) return NextResponse.json({ success: false, message: "Coordinator nahi mila" }, { status: 404 });

    const prefix = name.trim().substring(0, 3).toUpperCase();
    const suffix = mobile.substring(7, 10);

    user.name     = name.trim();
    user.age      = parseInt(age);
    user.gender   = gender;
    user.district = district || coord.district || "";
    user.address  = { state: "Bihar", district: district || coord.district || "" };
    user.preExistingDiseases = preExistingDiseases || [];
    if (idType)   user.idType   = idType;
    if (idNumber) user.idNumber = idNumber;
    user.referralCode             = `BRIMS-${prefix}${suffix}`;
    user.otp                      = undefined;
    user.otpExpiry                = undefined;
    user.registeredByCoordinator  = coord._id;
    user.isActive                 = true;
    await user.save();

    await Coordinator.findByIdAndUpdate(coord._id, { $inc: { totalClients: 1 } });

    return NextResponse.json({
      success: true,
      message: `${name} successfully register ho gaye!`,
      user: { _id: user._id, name: user.name, mobile: user.mobile, memberId: user.memberId },
    });
  }

  // ── action: add-member ────────────────────────────────────────────────────
  // Add secondary member to existing primary user's familyMembers[]
  if (action === "add-member") {
    const {
      primaryMobile, name, age, gender, relationship,
      preExistingDiseases, height, weight, alternateMobile,
    } = body;
    if (!primaryMobile || !name || !age || !gender || !relationship) {
      return NextResponse.json({ success: false, message: "Sabhi zaruri fields bharo" }, { status: 400 });
    }

    const primaryUser = await User.findOne({ mobile: primaryMobile });
    if (!primaryUser) return NextResponse.json({ success: false, message: "Primary user nahi mila" }, { status: 404 });
    if ((primaryUser.familyMembers || []).length >= 5) {
      return NextResponse.json({ success: false, message: "Maximum 5 secondary members ki limit ho gayi" }, { status: 400 });
    }

    // Generate secondary member ID from primary base
    const slotIndex = (primaryUser.familyMembers || []).length + 1;
    let memberId;
    if (primaryUser.memberId && /^BRIMS\d{9}/.test(primaryUser.memberId)) {
      memberId = primaryUser.memberId.slice(0, -1) + String(slotIndex);
    } else {
      const now = new Date();
      memberId = `BRIMS${String(now.getFullYear()).slice(-2)}${String(now.getMonth()+1).padStart(2,"0")}${String(Math.floor(10000 + Math.random() * 90000))}${slotIndex}`;
    }

    const ageNum    = parseInt(age);
    const isFemale  = gender === "female";
    const newMember = {
      memberId,
      name:               name.trim(),
      age:                ageNum,
      gender,
      relationship,
      maritalStatus:      isFemale && ageNum >= 18 ? (body.maritalStatus || undefined) : undefined,
      preExistingDiseases: preExistingDiseases || [],
      height:             height  ? parseInt(height)  : undefined,
      weight:             weight  ? parseInt(weight)  : undefined,
      alternateMobile:    alternateMobile || null,
      isActive:           true,
    };

    primaryUser.familyMembers.push(newMember);
    await primaryUser.save();

    const saved = primaryUser.familyMembers[primaryUser.familyMembers.length - 1];
    return NextResponse.json({
      success: true,
      message: `${name} ko ${primaryUser.name} ki family mein add kar diya!`,
      member: saved,
      primaryName: primaryUser.name,
    });
  }

  return NextResponse.json({ success: false, message: "Invalid action" }, { status: 400 });
}
