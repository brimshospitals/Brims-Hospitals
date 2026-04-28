import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../../lib/mongodb";
import FamilyCard from "../../../../models/FamilyCard";
import Transaction from "../../../../models/Transaction";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

const SALT_KEY   = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

// Same checksum pattern as /api/payment-callback
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
  const BASE = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  try {
    const body   = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    const url    = new URL(request.url);
    const userId = url.searchParams.get("userId");
    const txnId  = url.searchParams.get("txnId");

    if (!encodedResponse) {
      return NextResponse.redirect(`${BASE}/wallet?status=failed`);
    }

    // ── Checksum verification (security: prevent forged callbacks) ────────────
    const xVerify = request.headers.get("x-verify") || request.headers.get("X-VERIFY");
    if (!verifyCallbackChecksum(encodedResponse, xVerify)) {
      console.error("Wallet callback checksum mismatch — possible forged request");
      return NextResponse.redirect(`${BASE}/wallet?status=failed`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );
    const { code, data } = decodedResponse;

    if (code !== "PAYMENT_SUCCESS") {
      return NextResponse.redirect(`${BASE}/wallet?status=failed`);
    }

    // Use actual amount from PhonePe response (paise → rupees), never trust URL param
    const paidAmount   = data?.amount ? data.amount / 100 : 0;
    const phonePeTxnId = data?.transactionId || txnId;

    if (paidAmount <= 0) {
      return NextResponse.redirect(`${BASE}/wallet?status=failed`);
    }

    await connectDB();

    // ── Idempotency: prevent double-credit on duplicate callbacks ─────────────
    const existing = await Transaction.findOne({
      paymentId: phonePeTxnId,
      category:  "wallet_topup",
    }).lean();
    if (existing) {
      return NextResponse.redirect(`${BASE}/wallet?status=success&amount=${paidAmount}`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.redirect(`${BASE}/wallet?status=failed`);
    }

    // ── Atomic credit: add to User.walletBalance (same field used for deductions)
    await User.findByIdAndUpdate(userId, { $inc: { walletBalance: paidAmount } });

    // Keep FamilyCard.walletBalance in sync for display consistency
    if (user.familyCardId) {
      await FamilyCard.findByIdAndUpdate(user.familyCardId, { $inc: { walletBalance: paidAmount } });
    }
    // ─────────────────────────────────────────────────────────────────────────

    await Transaction.create({
      userId,
      familyCardId: user.familyCardId || null,
      type:         "credit",
      amount:       paidAmount,
      description:  `Wallet Top-up via PhonePe — ₹${paidAmount}`,
      paymentId:    phonePeTxnId,
      referenceId:  phonePeTxnId,
      category:     "wallet_topup",
      status:       "success",
    });

    return NextResponse.redirect(`${BASE}/wallet?status=success&amount=${paidAmount}`);
  } catch (error) {
    console.error("Wallet Callback Error:", error);
    const BASE2 = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
    return NextResponse.redirect(`${BASE2}/wallet?status=failed`);
  }
}

export async function GET(request) {
  const url    = new URL(request.url);
  const status = url.searchParams.get("status");
  const BASE   = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;
  return NextResponse.redirect(`${BASE}/wallet?status=${status || "failed"}`);
}
