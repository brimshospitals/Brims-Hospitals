import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { primaryUserId, switchToMemberId } = await request.json();

    if (!primaryUserId || !switchToMemberId) {
      return NextResponse.json(
        { success: false, message: "primaryUserId aur switchToMemberId chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    // Primary user dhundho
    const primaryUser = await User.findById(primaryUserId);
    if (!primaryUser || !primaryUser.familyCardId) {
      return NextResponse.json(
        { success: false, message: "User ya Family Card nahi mila" },
        { status: 404 }
      );
    }

    // Family card check karo
    const familyCard = await FamilyCard.findById(primaryUser.familyCardId);
    if (!familyCard) {
      return NextResponse.json(
        { success: false, message: "Family Card nahi mila" },
        { status: 404 }
      );
    }

    // Check karo ki member is family card ka hai
    const isMember = familyCard.members.some(
      (m) => m.toString() === switchToMemberId
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Yeh member is family card ka nahi hai" },
        { status: 403 }
      );
    }

    // Switch karne wale member ki details lo
    const memberToSwitch = await User.findById(switchToMemberId)
      .select("-otp -otpExpiry");

    if (!memberToSwitch) {
      return NextResponse.json(
        { success: false, message: "Member nahi mila" },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: `${memberToSwitch.name} ke profile pe switch ho gaye!`,
      activeUser: {
        _id: memberToSwitch._id,
        name: memberToSwitch.name,
        age: memberToSwitch.age,
        gender: memberToSwitch.gender,
        photo: memberToSwitch.photo,
        memberId: memberToSwitch.memberId,
        preExistingDiseases: memberToSwitch.preExistingDiseases,
        height: memberToSwitch.height,
        weight: memberToSwitch.weight,
        relationship: memberToSwitch.relationship,
      },
    });

  } catch (error) {
    console.error("Switch Profile Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}