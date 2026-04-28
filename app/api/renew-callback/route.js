import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/mongodb";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

const BASE_URL   = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
const SALT_KEY   = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

function verifyCallbackChecksum(encodedResponse, xVerifyHeader) {
  if (!xVerifyHeader || !SALT_KEY) return false;
  const expected =
    crypto.createHash("sha256")
      .update(encodedResponse + SALT_KEY)
      .digest("hex") +
    "###" + SALT_INDEX;
  return xVerifyHeader === expected;
}

export async function POST(request) {
  try {
    const body   = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    if (!encodedResponse) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    // ── Checksum verification ─────────────────────────────────────────────────
    const xVerify = request.headers.get("x-verify") || request.headers.get("X-VERIFY");
    if (!verifyCallbackChecksum(encodedResponse, xVerify)) {
      console.error("Renew callback checksum mismatch");
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );
    const { code, data } = decodedResponse;

    const url    = new URL(request.url);
    const cardId = url.searchParams.get("cardId");
    const txnId  = url.searchParams.get("txnId") || data?.transactionId || "";
    const userId = url.searchParams.get("userId");

    if (code !== "PAYMENT_SUCCESS" || !cardId) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    await connectDB();

    // Calculate new expiry before the update
    const now         = new Date();
    const currentCard = await FamilyCard.findById(cardId).lean();
    if (!currentCard) {
      return NextResponse.redirect(`${BASE_URL}/dashboard?renewal=failed`);
    }

    const baseDate   = currentCard.expiryDate && currentCard.expiryDate > now
      ? new Date(currentCard.expiryDate) : now;
    const newExpiry  = new Date(baseDate.getTime() + 365 * 24 * 60 * 60 * 1000);
    const paidAmount = data?.amount ? data.amount / 100 : 249;

    // ── Atomic: only process if this txnId hasn't been used before ────────────
    // Prevents duplicate renewals from PhonePe webhook retries
    const updated = await FamilyCard.findOneAndUpdate(
      { _id: cardId, paymentId: { $ne: txnId } },
      {
        $set: {
          expiryDate: newExpiry,
          status:     "active",
          paymentId:  txnId,
          amountPaid: paidAmount,
        },
      },
      { new: true }
    );

    if (!updated) {
      // Duplicate webhook — already renewed with this txnId, return idempotent success
      const card = await FamilyCard.findById(cardId).lean();
      const expStr = card?.expiryDate
        ? new Date(card.expiryDate).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })
        : "";
      return NextResponse.redirect(
        `${BASE_URL}/dashboard?renewal=success&expiry=${encodeURIComponent(expStr)}`
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Record payment
    try {
      await Transaction.create({
        userId:      userId || currentCard.primaryMemberId,
        type:        "credit",
        amount:      paidAmount,
        description: `Family Card Renewal — ₹${paidAmount}`,
        referenceId: txnId,
        category:    "card_activation_payment",
        status:      "success",
      });
    } catch (txnErr) {
      console.error("Renewal transaction record error:", txnErr.message);
    }

    // Ensure user role is member (in case it was somehow downgraded)
    if (userId) {
      try {
        await User.findOneAndUpdate(
          { _id: userId, role: "user" },
          { $set: { role: "member" } }
        );
      } catch {}
    }

    const expiryStr = newExpiry.toLocaleDateString("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
    });
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
  return NextResponse.redirect(
    `${BASE_URL}/dashboard?renewal=${url.searchParams.get("renewal") || "failed"}`
  );
}
