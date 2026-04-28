import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import FamilyCard from "../../../../models/FamilyCard";
import { getSession } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    // ── Auth ──────────────────────────────────────────────────────────────────
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Login zaruri hai" },
        { status: 401 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { searchParams } = new URL(request.url);
    const requestedUserId  = searchParams.get("userId") || session.userId;

    // Ownership check — users can only fetch their own family data
    // (admin can fetch any)
    if (session.role !== "admin" && session.userId.toString() !== requestedUserId.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap doosre user ka data nahi dekh sakte" },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findById(requestedUserId).select("-otp -otpExpiry").lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    let familyCard = null;
    if (user.familyCardId) {
      familyCard = await FamilyCard.findById(user.familyCardId).lean();

      // Auto-mark expired cards
      if (familyCard && familyCard.status === "active" && familyCard.expiryDate && new Date(familyCard.expiryDate) < new Date()) {
        await FamilyCard.findByIdAndUpdate(familyCard._id, { $set: { status: "expired" } });
        familyCard.status = "expired";
      }
    }

    return NextResponse.json({
      success:       true,
      familyMembers: user.familyMembers || [],
      familyCard,
      user,
    });
  } catch (error) {
    console.error("Family Get Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
