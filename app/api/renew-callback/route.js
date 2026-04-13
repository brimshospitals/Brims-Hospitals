import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import FamilyCard from "../../../models/FamilyCard";

export const dynamic = "force-dynamic";

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL;

export async function POST(request) {
  try {
    const body   = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    if (!encodedResponse) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );

    const { code, data } = decodedResponse;

    const url    = new URL(request.url);
    const cardId = url.searchParams.get("cardId");

    if (code !== "PAYMENT_SUCCESS" || !cardId) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    await connectDB();

    const familyCard = await FamilyCard.findById(cardId);
    if (!familyCard) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    // Extend expiry by 1 year from today (or from current expiry if still active)
    const now = new Date();
    const baseDate = familyCard.expiryDate && familyCard.expiryDate > now
      ? new Date(familyCard.expiryDate)
      : now;

    const newExpiry = new Date(baseDate);
    newExpiry.setFullYear(newExpiry.getFullYear() + 1);

    familyCard.expiryDate = newExpiry;
    familyCard.status     = "active";
    familyCard.paymentId  = data?.transactionId || "";
    familyCard.amountPaid = data?.amount ? data.amount / 100 : 249;
    await familyCard.save();

    const expiryStr = newExpiry.toLocaleDateString("en-IN", { day:"2-digit", month:"short", year:"numeric" });
    return NextResponse.redirect(
      `${BASE_URL}/dashboard?renewal=success&expiry=${encodeURIComponent(expiryStr)}`
    );
  } catch (error) {
    console.error("Renew Callback Error:", error);
    return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  const renewal = url.searchParams.get("renewal");
  return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=${renewal || "failed"}`);
}
