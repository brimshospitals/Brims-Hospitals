import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

export async function GET(request) {
  try {
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "userId chahiye" },
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

    let balance = 0;
    let transactions = [];

    if (user.familyCardId) {
      const familyCard = await FamilyCard.findById(user.familyCardId);
      if (familyCard) {
        balance = familyCard.walletBalance || 0;
        transactions = await Transaction.find({
          familyCardId: user.familyCardId,
        }).sort({ createdAt: -1 }).limit(50);
      }
    }

    return NextResponse.json({
      success: true,
      balance,
      transactions,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}