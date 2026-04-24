import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";
import { getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// Only works when SHOW_OTP=true (testing mode)
const IS_TEST = process.env.SHOW_OTP === "true";

function generateCardNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BRIMS-${year}-${random}`;
}

export async function POST(request) {
  if (!IS_TEST) {
    return NextResponse.json({ success: false, message: "Testing mode disabled" }, { status: 403 });
  }

  try {
    const session = await getSession(request);
    if (!session?.userId) {
      return NextResponse.json({ success: false, message: "Login required" }, { status: 401 });
    }

    await connectDB();
    const user = await User.findById(session.userId);
    if (!user) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 });

    // Already has a card?
    if (user.familyCardId) {
      const existing = await FamilyCard.findById(user.familyCardId);
      if (existing && existing.status === "active") {
        return NextResponse.json({ success: true, message: "Card already active", cardNumber: existing.cardNumber, alreadyActive: true });
      }
    }

    // Create free card for testing
    const cardNumber = generateCardNumber();
    const now = new Date();
    const expiry = new Date(now);
    expiry.setFullYear(expiry.getFullYear() + 1);

    const familyCard = await FamilyCard.create({
      primaryMemberId: user._id,
      cardNumber,
      members: [user._id],
      membersCount: 1,
      walletBalance: 0,
      activationDate: now,
      expiryDate: expiry,
      status: "active",
      paymentId: "TEST-FREE-ACTIVATION",
      amountPaid: 0,
    });

    user.familyCardId = familyCard._id;
    user.role = "member";
    await user.save();

    return NextResponse.json({
      success: true,
      message: "Card activated (test mode — free)",
      cardNumber,
      expiryDate: expiry,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
