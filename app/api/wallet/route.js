import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import Transaction from "../../../models/Transaction";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

export async function GET(request) {
  const { error, session } = await requireAuth(request, [
    "user", "member", "staff", "admin", "coordinator", "doctor", "hospital",
  ]);
  if (error) return error;

  try {
    const url    = new URL(request.url);
    const userId = url.searchParams.get("userId") || session.userId;

    // Only allow fetching own wallet; admin can fetch any user's wallet
    if (session.role !== "admin" && userId !== session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(userId).select("walletBalance familyCardId").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    }

    // Use User.walletBalance — same field deducted on every booking payment
    const balance = user.walletBalance || 0;

    // Filter by userId to capture all transaction types: top-up, bookings, cashback, etc.
    const transactions = await Transaction.find({ userId })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    return NextResponse.json({ success: true, balance, transactions });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
