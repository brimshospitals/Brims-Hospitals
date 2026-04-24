import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

// Secondary member ID: same base as primary (BRIMSYYMMXXXXX), last digit = slot index 1–5
function generateSecondaryMemberId(primaryMemberId, slotIndex) {
  // New format: BRIMSYYMMXXXXX0 → strip last char, append slotIndex
  if (primaryMemberId && /^BRIMS\d{9}/.test(primaryMemberId)) {
    return primaryMemberId.slice(0, -1) + String(slotIndex);
  }
  // Fallback for legacy IDs (BRIMS-XXXXXX format)
  const now  = new Date();
  const YY   = String(now.getFullYear()).slice(-2);
  const MM   = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(10000 + Math.random() * 90000));
  return `BRIMS${YY}${MM}${rand}${slotIndex}`;
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

    // Slot index = current count + 1 (1 for first secondary, up to 5)
    const slotIndex = (primaryUser.familyMembers || []).length + 1;
    const newMember = {
      memberId:             generateSecondaryMemberId(primaryUser.memberId, slotIndex),
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