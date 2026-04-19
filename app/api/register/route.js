import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

function generateReferralCode(name, mobile) {
  const prefix = name.substring(0, 3).toUpperCase();
  const suffix = mobile.substring(7, 10);
  return `BRIMS-${prefix}${suffix}`;
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      userId, mobile, name, age, gender,
      maritalStatus, isPregnant, lmp,
      idType, idNumber, email,
      district, prakhand, village,
      preExistingDiseases, height, weight,
      photo,
      referralCode: inputReferralCode,
    } = body;

    if (!mobile || !name || !age || !gender || !idType || !idNumber || !district) {
      return NextResponse.json(
        { success: false, message: "Sabhi zaruri fields bharo: naam, umar, ling, ID type, ID number, aur zila" },
        { status: 400 }
      );
    }

    await connectDB();

    // Find user by userId (normal flow) or by mobile (staff-initiated flow)
    let user = null;
    if (userId) {
      user = await User.findById(userId);
    }
    if (!user && mobile) {
      user = await User.findOne({ mobile: mobile.trim() });
    }
    // If still not found, create a new user (staff walk-in registration)
    if (!user) {
      user = await User.create({
        mobile: mobile.trim(),
        name:   name.trim(),
        age:    parseInt(age),
        gender,
        role:   "user",
      });
    }

    // Referral code generate karo
    const referralCode = generateReferralCode(name, mobile);

    // Member ID already generated hai schema mein
    // User update karo
    user.name = name;
    user.age = parseInt(age);
    user.gender = gender;
    user.idType = idType;
    user.idNumber = idNumber;
    user.email = email || "";
    if (photo) user.photo = photo;
    user.address = {
      state: "Bihar",
      district,
      prakhand: prakhand || "",
      village: village || "",
    };
    user.preExistingDiseases = preExistingDiseases || [];
    user.height = height ? parseInt(height) : null;
    user.weight = weight ? parseInt(weight) : null;
    user.referralCode = referralCode;

    // Apply incoming referral code if provided and not already set
    if (inputReferralCode && !user.referredBy) {
      const code = inputReferralCode.trim().toUpperCase();
      const referrer = await User.findOne({ referralCode: code });
      if (referrer && referrer._id.toString() !== userId) {
        user.referredBy     = code;
        user.walletBalance  = (user.walletBalance || 0) + 50;
        referrer.walletBalance = (referrer.walletBalance || 0) + 50;
        await referrer.save();
        // Transactions
        const { default: Transaction } = await import("../../../models/Transaction.js");
        await Transaction.create([
          { userId: user._id,    type:"credit", amount:50, description:`Referral cashback — code ${code} use kiya`, referenceId:code,             status:"success" },
          { userId: referrer._id,type:"credit", amount:50, description:`Referral reward — ${name} ne aapka code use kiya`, referenceId:userId, status:"success" },
        ]);
      }
    }

    // Sirf female 18+ ke liye
    if (gender === "female" && parseInt(age) >= 18) {
      user.maritalStatus = maritalStatus || "";
      // Sirf married female ke liye
      if (maritalStatus === "married") {
        user.isPregnant = isPregnant || false;
        user.lmp = isPregnant && lmp ? new Date(lmp) : null;
      }
    }

    await user.save();

    return NextResponse.json({
      success: true,
      message: "Registration ho gayi!",
      referralCode,
      memberId: user.memberId,
    });
  } catch (error) {
    console.error("Register Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}