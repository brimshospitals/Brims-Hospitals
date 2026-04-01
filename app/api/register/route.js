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
    } = body;

    if (!userId || !mobile || !name || !age || !gender || !idType || !idNumber || !district) {
      return NextResponse.json(
        { success: false, message: "Sabhi zaruri fields bharo" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
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