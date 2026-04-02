import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";

export const dynamic = "force-dynamic";

function generateMemberId() {
  return "BRIMS-" + Date.now().toString(36).toUpperCase();
}

export async function POST(request) {
  try {
    const body = await request.json();
    const {
      primaryUserId, name, age, gender,
      maritalStatus, isPregnant, lmp,
      relationship, preExistingDiseases,
      height, weight, photo,
    } = body;

    if (!primaryUserId || !name || !age || !gender || !relationship) {
      return NextResponse.json(
        { success: false, message: "Sabhi zaruri fields bharo" },
        { status: 400 }
      );
    }

    await connectDB();

    // Primary user dhundho
    const primaryUser = await User.findById(primaryUserId);
    if (!primaryUser) {
      return NextResponse.json(
        { success: false, message: "Primary user nahi mila" },
        { status: 404 }
      );
    }

    // Family card check karo
    if (!primaryUser.familyCardId) {
      return NextResponse.json(
        { success: false, message: "Pehle Family Card activate karein" },
        { status: 400 }
      );
    }

    const familyCard = await FamilyCard.findById(primaryUser.familyCardId);
    if (!familyCard) {
      return NextResponse.json(
        { success: false, message: "Family Card nahi mila" },
        { status: 404 }
      );
    }

    // Max 6 members check (1 primary + 5 secondary)
    if (familyCard.members.length >= 6) {
      return NextResponse.json(
        { success: false, message: "Maximum 6 members ki limit ho gayi" },
        { status: 400 }
      );
    }

    // Naya member banao
    const memberId = generateMemberId();
    const newMember = await User.create({
      mobile: primaryUser.mobile, // Same mobile number
      name,
      age: parseInt(age),
      gender,
      maritalStatus: gender === "female" && parseInt(age) >= 18 ? maritalStatus : undefined,
      isPregnant: gender === "female" && maritalStatus === "married" ? isPregnant : false,
      lmp: isPregnant && lmp ? new Date(lmp) : null,
      relationship,
      preExistingDiseases: preExistingDiseases || [],
      height: height ? parseInt(height) : null,
      weight: weight ? parseInt(weight) : null,
      photo: photo || "",
      memberId,
      familyCardId: familyCard._id,
      isPrimaryMember: false,
      role: "user",
      isActive: true,
    });

    // Family card mein member add karo
    familyCard.members.push(newMember._id);
    familyCard.membersCount = familyCard.members.length;
    await familyCard.save();

    return NextResponse.json({
      success: true,
      message: `${name} successfully add ho gaye!`,
      memberId: newMember.memberId,
      membersCount: familyCard.members.length,
    });

  } catch (error) {
    console.error("Add Member Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}