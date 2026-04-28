import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Transaction from "../../../../models/Transaction";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

export async function POST(request) {
  const { error, session } = await requireAuth(request, [
    "user", "member", "staff", "admin", "coordinator",
  ]);
  if (error) return error;

  try {
    const { userId, amount, description, referenceId, category } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json(
        { success: false, message: "userId aur amount required" },
        { status: 400 }
      );
    }

    // Ownership check — only admin/staff can deduct from another user's wallet
    if (session.role !== "admin" && session.role !== "staff" && userId !== session.userId) {
      return NextResponse.json(
        { success: false, message: "Aap sirf apna wallet deduct kar sakte hain" },
        { status: 403 }
      );
    }

    await connectDB();

    // Atomic deduction — prevents overdraft race condition
    const user = await User.findOneAndUpdate(
      { _id: userId, walletBalance: { $gte: amount } },
      { $inc: { walletBalance: -amount } },
      { new: false }
    );

    if (!user) {
      const current = await User.findById(userId).select("walletBalance").lean();
      if (!current) {
        return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
      }
      return NextResponse.json({
        success: false,
        message: `Wallet balance kam hai. Available: ₹${current.walletBalance || 0}. ₹${amount} chahiye.`,
      }, { status: 400 });
    }

    await Transaction.create({
      userId:      user._id,
      familyCardId: user.familyCardId || null,
      type:        "debit",
      amount,
      description: description || "Wallet deduction",
      referenceId: referenceId || `DEBIT-${Date.now()}`,
      category:    category || "booking_payment",
      status:      "success",
    });

    return NextResponse.json({
      success:    true,
      message:    `₹${amount} wallet se deduct ho gaya`,
      newBalance: (user.walletBalance || 0) - amount,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
