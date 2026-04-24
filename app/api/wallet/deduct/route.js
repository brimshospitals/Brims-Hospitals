import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import Transaction from "../../../../models/Transaction";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { userId, amount, description, referenceId } = await request.json();

    if (!userId || !amount || amount <= 0) {
      return NextResponse.json({ success: false, message: "userId aur amount required" }, { status: 400 });
    }

    await connectDB();
    const user = await User.findById(userId);
    if (!user) return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });

    if ((user.walletBalance || 0) < amount) {
      return NextResponse.json({
        success: false,
        message: `Wallet balance kam hai. Aapka balance: ₹${user.walletBalance || 0}. Pehle wallet mein ₹${amount} add karein.`,
      }, { status: 400 });
    }

    user.walletBalance = (user.walletBalance || 0) - amount;
    await user.save();

    await Transaction.create({
      userId: user._id,
      familyCardId: user.familyCardId || null,
      type: "debit",
      amount,
      description: description || "Wallet deduction",
      referenceId: referenceId || `DEBIT-${Date.now()}`,
      status: "success",
    });

    return NextResponse.json({
      success: true,
      message: `₹${amount} wallet se deduct ho gaya`,
      newBalance: user.walletBalance,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
