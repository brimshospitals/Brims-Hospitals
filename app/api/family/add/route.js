import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import FamilyCard from "../../../../models/FamilyCard";
import { getSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// Proxy to the same logic as /api/add-member — kept for backward compat
// Both endpoints now require auth and perform the same validations
export async function POST(request) {
  try {
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Login zaruri hai" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      primaryUserId, name, age, gender,
      maritalStatus, isPregnant, lmp,
      relationship, preExistingDiseases,
      height, weight, photo, alternateMobile,
    } = body;

    // Use session userId as primaryUserId if not provided
    const resolvedPrimaryId = primaryUserId || session.userId;

    // Ownership check — only primary member can add family members for themselves
    if (session.userId.toString() !== resolvedPrimaryId.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap doosre user ke family members add nahi kar sakte" },
        { status: 403 }
      );
    }

    if (!name || !age || !gender || !relationship) {
      return NextResponse.json(
        { success: false, message: "Naam, umar, ling aur rishta zaruri hai" },
        { status: 400 }
      );
    }

    await connectDB();

    const primaryUser = await User.findById(resolvedPrimaryId);
    if (!primaryUser) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    if (!primaryUser.familyCardId) {
      return NextResponse.json(
        { success: false, message: "Pehle Family Card activate karein" },
        { status: 400 }
      );
    }

    // Card expiry check
    const familyCard = await FamilyCard.findById(primaryUser.familyCardId).lean();
    if (!familyCard || familyCard.status !== "active" || new Date(familyCard.expiryDate) < new Date()) {
      return NextResponse.json(
        { success: false, message: "Family Card expired hai. Pehle renew karein." },
        { status: 400 }
      );
    }

    const ageNum    = parseInt(age);
    const isFemale  = gender === "female";
    const effectiveMarital = maritalStatus || (
      ["spouse", "parent", "inlaw"].includes(relationship) ? "married" : undefined
    );
    const canBePregnant = isFemale && effectiveMarital === "married" && ageNum >= 17 && ageNum <= 50;

    function generateSecondaryMemberId(primaryMemberId, slotIndex) {
      if (primaryMemberId && /^BRIMS\d{9}/.test(primaryMemberId)) {
        return primaryMemberId.slice(0, -1) + String(slotIndex);
      }
      const now  = new Date();
      const YY   = String(now.getFullYear()).slice(-2);
      const MM   = String(now.getMonth() + 1).padStart(2, "0");
      const rand = String(Math.floor(10000 + Math.random() * 90000));
      return `BRIMS${YY}${MM}${rand}${slotIndex}`;
    }

    const currentCount = (primaryUser.familyMembers || []).length;
    const newMember = {
      memberId:            generateSecondaryMemberId(primaryUser.memberId, currentCount + 1),
      name:                name.trim(),
      age:                 ageNum,
      gender,
      maritalStatus:       isFemale && ageNum >= 18 ? effectiveMarital : undefined,
      isPregnant:          canBePregnant ? !!isPregnant : false,
      lmp:                 canBePregnant && isPregnant && lmp ? new Date(lmp) : undefined,
      relationship,
      preExistingDiseases: preExistingDiseases || [],
      height:              height ? parseInt(height) : undefined,
      weight:              weight ? parseInt(weight) : undefined,
      photo:               photo || "",
      alternateMobile:     alternateMobile || null,
      isActive:            true,
    };

    // ── Atomic push with size guard — prevents race condition overdraft ────────
    const updated = await User.findOneAndUpdate(
      {
        _id: resolvedPrimaryId,
        $expr: { $lt: [{ $size: { $ifNull: ["$familyMembers", []] } }, 5] },
      },
      { $push: { familyMembers: newMember } },
      { new: true }
    );

    if (!updated) {
      return NextResponse.json(
        { success: false, message: "Maximum 5 family members ki limit ho gayi hai" },
        { status: 400 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const saved = updated.familyMembers[updated.familyMembers.length - 1];

    return NextResponse.json({
      success: true,
      message: `${name} successfully add ho gaye!`,
      memberId:     saved.memberId || newMember.memberId,
      totalMembers: updated.familyMembers.length + 1,
    });
  } catch (error) {
    console.error("Family Add Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
