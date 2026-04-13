import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User        from "../../../models/User";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

const CASHBACK_AMOUNT = 50; // ₹50 referrer ko, ₹50 new user ko

// GET — Get referral stats for a user
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId = searchParams.get("userId");
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).select("referralCode referredBy walletBalance name").lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    }

    // Kitne log is code se aaye
    const referredCount = await User.countDocuments({ referredBy: user.referralCode });

    // Referral transactions
    const earnings = await Transaction.find({
      userId,
      description: { $regex: "referral", $options: "i" },
      status: "success",
    }).sort({ createdAt: -1 }).limit(20).lean();

    return NextResponse.json({
      success: true,
      referralCode: user.referralCode || null,
      referredCount,
      totalEarned: earnings.reduce((s, t) => s + t.amount, 0),
      earnings,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}

// POST — Apply a referral code during registration / first-time use
export async function POST(request) {
  try {
    const { userId, referralCode } = await request.json();

    if (!userId || !referralCode) {
      return NextResponse.json({ success: false, message: "userId aur referralCode zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const newUser = await User.findById(userId);
    if (!newUser) {
      return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    }

    // Already referred?
    if (newUser.referredBy) {
      return NextResponse.json({ success: false, message: "Aap pehle se ek referral code use kar chuke hain" }, { status: 400 });
    }

    // Find referrer
    const referrer = await User.findOne({ referralCode: referralCode.trim().toUpperCase() });
    if (!referrer) {
      return NextResponse.json({ success: false, message: "Invalid referral code" }, { status: 404 });
    }

    // Can't refer yourself
    if (referrer._id.toString() === userId) {
      return NextResponse.json({ success: false, message: "Apna khud ka code use nahi kar sakte" }, { status: 400 });
    }

    // Apply referral
    newUser.referredBy = referralCode.trim().toUpperCase();
    newUser.walletBalance = (newUser.walletBalance || 0) + CASHBACK_AMOUNT;
    await newUser.save();

    // Referrer ko bhi cashback
    referrer.walletBalance = (referrer.walletBalance || 0) + CASHBACK_AMOUNT;
    await referrer.save();

    // Transactions record
    await Transaction.create([
      {
        userId:      newUser._id,
        type:        "credit",
        amount:      CASHBACK_AMOUNT,
        description: `Referral cashback — code ${referralCode} use kiya`,
        referenceId: referralCode,
        status:      "success",
      },
      {
        userId:      referrer._id,
        type:        "credit",
        amount:      CASHBACK_AMOUNT,
        description: `Referral reward — ${newUser.name || "New User"} ne aapka code use kiya`,
        referenceId: newUser._id.toString(),
        status:      "success",
      },
    ]);

    return NextResponse.json({
      success: true,
      message: `₹${CASHBACK_AMOUNT} aapke wallet mein add ho gaye! ${referrer.name} ne aapko refer kiya tha.`,
      cashback: CASHBACK_AMOUNT,
    });
  } catch (error) {
    return NextResponse.json({ success: false, message: error.message }, { status: 500 });
  }
}
