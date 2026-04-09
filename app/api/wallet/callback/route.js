import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import FamilyCard from "../../../../models/FamilyCard";
import Transaction from "../../../../models/Transaction";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const body = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    const url = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const amount = url.searchParams.get("amount");
    const txnId = url.searchParams.get("txnId");

    if (!encodedResponse) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/wallet?status=failed`
      );
    }

    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );

    if (decodedResponse.code !== "PAYMENT_SUCCESS") {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/wallet?status=failed`
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user || !user.familyCardId) {
      return NextResponse.redirect(
        `${process.env.NEXTAUTH_URL}/wallet?status=failed`
      );
    }

    // Wallet balance update karo
    const familyCard = await FamilyCard.findById(user.familyCardId);
    familyCard.walletBalance += parseInt(amount);
    await familyCard.save();

    // Transaction record banao
    await Transaction.create({
      userId,
      familyCardId: user.familyCardId,
      type: "credit",
      amount: parseInt(amount),
      description: `Wallet top-up via PhonePe`,
      paymentId: txnId,
      status: "success",
    });

    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/wallet?status=success&amount=${amount}`
    );

  } catch (error) {
    console.error("Wallet Callback Error:", error);
    return NextResponse.redirect(
      `${process.env.NEXTAUTH_URL}/wallet?status=failed`
    );
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/wallet?status=${status || "failed"}`
  );
}