import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";

export const dynamic = "force-dynamic";

const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

// Card number generate karna
function generateCardNumber() {
  const year = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BRIMS-${year}-${random}`;
}

export async function POST(request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    if (!encodedResponse) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?payment=failed`
      );
    }

    // Decode response
    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );

    const { code, data } = decodedResponse;

    // URL se userId aur txnId lo
    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const txnId = url.searchParams.get("txnId");

    // Payment success check
    if (code !== "PAYMENT_SUCCESS") {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?payment=failed`
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?payment=failed`
      );
    }

    // First-time activation only (not renewal — renewal uses /api/renew-card)
    const isFirstActivation = !user.familyCardId;

    // Family Card banana
    const cardNumber = generateCardNumber();
    const activationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1);

    const familyCard = await FamilyCard.create({
      primaryMemberId: userId,
      cardNumber,
      members: [userId],
      membersCount: 1,
      walletBalance: 0,
      activationDate,
      expiryDate,
      status: "active",
      paymentId: data?.transactionId || txnId,
      amountPaid: data?.amount ? data.amount / 100 : 249,
    });

    // User ko card link karo aur role upgrade
    user.familyCardId = familyCard._id;
    user.role = "member";
    await user.save();

    // Referral cashback — dono ko ₹50 jab pehli baar card activate ho
    if (isFirstActivation && user.referredBy) {
      try {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
          user.walletBalance    = (user.walletBalance    || 0) + 50;
          referrer.walletBalance = (referrer.walletBalance || 0) + 50;
          await Promise.all([user.save(), referrer.save()]);
          const { default: Transaction } = await import("../../../models/Transaction.js");
          await Transaction.create([
            {
              userId:      user._id,
              type:        "credit",
              amount:      50,
              description: `Referral cashback — Family Card activate kiya (code: ${user.referredBy})`,
              referenceId: user.referredBy,
              status:      "success",
            },
            {
              userId:      referrer._id,
              type:        "credit",
              amount:      50,
              description: `Referral reward — ${user.name || "User"} ne Family Card activate kiya`,
              referenceId: user._id.toString(),
              status:      "success",
            },
          ]);
        }
      } catch (refErr) {
        console.error("Referral cashback error:", refErr);
        // Non-fatal — card activation should still succeed
      }
    }

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?payment=success&cardNumber=${cardNumber}`
    );
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/dashboard?payment=failed`
    );
  }
}

// GET request bhi handle karo
export async function GET(request) {
  const url = new URL(request.url);
  const payment = url.searchParams.get("payment");

  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/dashboard?payment=${payment || "failed"}`
  );
}