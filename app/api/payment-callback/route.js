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

    // Check karo koi existing card toh nahi
    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/dashboard?payment=failed`
      );
    }

    // Family Card banana
    const cardNumber = generateCardNumber();
    const activationDate = new Date();
    const expiryDate = new Date();
    expiryDate.setFullYear(expiryDate.getFullYear() + 1); // 1 saal valid

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
      amountPaid: data?.amount ? data.amount / 100 : 999,
    });

    // User ko card link karo
    user.familyCardId = familyCard._id;
    await user.save();

    // Success page pe redirect
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