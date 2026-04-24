import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

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
      height, weight, photo, alternateMobile,
    } = body;

    if (!primaryUserId || !name || !age || !gender || !relationship) {
      return NextResponse.json(
        { success: false, message: "Naam, umar, ling aur rishta zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const primaryUser = await User.findById(primaryUserId);
    if (!primaryUser) {
      return NextResponse.json(
        { success: false, message: "Primary user nahi mila" },
        { status: 404 }
      );
    }

    // Card check
    if (!primaryUser.familyCardId) {
      return NextResponse.json(
        { success: false, message: "Pehle Family Card activate karein" },
        { status: 400 }
      );
    }

    // Max 5 secondary members (familyMembers[] stores secondary only)
    if ((primaryUser.familyMembers || []).length >= 5) {
      return NextResponse.json(
        { success: false, message: "Maximum 5 secondary members ki limit ho gayi hai" },
        { status: 400 }
      );
    }

    // Build the embedded member object
    const ageNum = parseInt(age);
    const isFemale = gender === "female";
    const effectiveMarital = maritalStatus || (
      ["spouse", "parent", "inlaw"].includes(relationship) ? "married" : undefined
    );
    const canBePregnant = isFemale && effectiveMarital === "married" && ageNum >= 17 && ageNum <= 50;

    const newMember = {
      memberId:             generateMemberId(),
      name:                 name.trim(),
      age:                  ageNum,
      gender,
      maritalStatus:        isFemale && ageNum >= 18 ? effectiveMarital : undefined,
      isPregnant:           canBePregnant ? !!isPregnant : false,
      lmp:                  canBePregnant && isPregnant && lmp ? new Date(lmp) : undefined,
      relationship,
      preExistingDiseases:  preExistingDiseases || [],
      height:               height ? parseInt(height) : undefined,
      weight:               weight ? parseInt(weight) : undefined,
      photo:                photo || "",
      alternateMobile:      alternateMobile || null,
      isActive:             true,
    };

    // Push as embedded subdocument — no new User document created
    primaryUser.familyMembers.push(newMember);
    await primaryUser.save();

    // Return the memberId assigned by the schema default (may differ from generated above
    // if schema also generates one — use the one actually saved)
    const saved = primaryUser.familyMembers[primaryUser.familyMembers.length - 1];

    return NextResponse.json({
      success: true,
      message: `${name} successfully add ho gaye!`,
      memberId: saved.memberId || newMember.memberId,
      totalMembers: primaryUser.familyMembers.length + 1, // +1 for primary
    });

  } catch (error) {
    console.error("Add Member Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}