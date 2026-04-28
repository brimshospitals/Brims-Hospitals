import { NextResponse } from "next/server";
import crypto from "crypto";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";
import Transaction from "../../../models/Transaction";

export const dynamic = "force-dynamic";

const SALT_KEY   = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

function generateCardNumber() {
  const year   = new Date().getFullYear();
  const random = Math.floor(10000 + Math.random() * 90000);
  return `BRIMS-${year}-${random}`;
}

// Verify PhonePe callback signature
// X-VERIFY = SHA256(base64Response + SALT_KEY) + "###" + saltIndex
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
  const BASE = process.env.NEXTAUTH_URL;
  try {
    const body  = await request.text();
    const params = new URLSearchParams(body);
    const encodedResponse = params.get("response");

    if (!encodedResponse) {
      return NextResponse.redirect(`${BASE}/dashboard?payment=failed`);
    }

    // ── Checksum verification (security: prevent forged callbacks) ────────────
    const xVerify = request.headers.get("x-verify") || request.headers.get("X-VERIFY");
    if (!verifyCallbackChecksum(encodedResponse, xVerify)) {
      console.error("PhonePe callback checksum mismatch — possible forged request");
      return NextResponse.redirect(`${BASE}/dashboard?payment=failed`);
    }
    // ─────────────────────────────────────────────────────────────────────────

    const decodedResponse = JSON.parse(
      Buffer.from(encodedResponse, "base64").toString("utf-8")
    );
    const { code, data } = decodedResponse;

    const url      = new URL(request.url);
    const userId   = url.searchParams.get("userId");
    const txnId    = url.searchParams.get("txnId");
    const from     = url.searchParams.get("from");
    const returnUrl = url.searchParams.get("returnUrl");

    if (code !== "PAYMENT_SUCCESS") {
      return NextResponse.redirect(`${BASE}/dashboard?payment=failed`);
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.redirect(`${BASE}/dashboard?payment=failed`);
    }

    // ── Idempotency: if user already has an active card, treat as success ─────
    if (user.familyCardId) {
      const existing = await FamilyCard.findById(user.familyCardId);
      if (existing && existing.status === "active") {
        let successUrl = `${BASE}/dashboard?payment=success&cardNumber=${existing.cardNumber}`;
        if (from === "coordinator") successUrl += "&from=coordinator";
        if (returnUrl?.startsWith("/")) {
          successUrl = `${BASE}${returnUrl}?activated=1&cardNumber=${existing.cardNumber}`;
        }
        return NextResponse.redirect(successUrl);
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Create Family Card
    const cardNumber     = generateCardNumber();
    const activationDate = new Date();
    const expiryDate     = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000); // exact 365 days
    const paidAmount     = data?.amount ? data.amount / 100 : 249;

    const familyCard = await FamilyCard.create({
      primaryMemberId: userId,
      cardNumber,
      members:         [userId],
      membersCount:    1,
      walletBalance:   0,
      activationDate,
      expiryDate,
      status:    "active",
      paymentId: data?.transactionId || txnId,
      amountPaid: paidAmount,
    });

    // ── Atomic: set familyCardId only if not already set ──────────────────────
    // Prevents race condition where two concurrent callbacks both create a card
    const updatedUser = await User.findOneAndUpdate(
      { _id: userId, familyCardId: null },
      {
        $set: {
          familyCardId: familyCard._id,
          // Only upgrade user → member; preserve doctor/hospital/staff/admin roles
          ...(user.role === "user" && { role: "member" }),
        },
      },
      { new: true }
    );

    if (!updatedUser) {
      // Another callback already set familyCardId — delete the duplicate card
      await FamilyCard.deleteOne({ _id: familyCard._id });
      const existingCard = await FamilyCard.findById(user.familyCardId);
      let successUrl = `${BASE}/dashboard?payment=success&cardNumber=${existingCard?.cardNumber || ""}`;
      if (returnUrl?.startsWith("/")) {
        successUrl = `${BASE}${returnUrl}?activated=1&cardNumber=${existingCard?.cardNumber || ""}`;
      }
      return NextResponse.redirect(successUrl);
    }
    // ─────────────────────────────────────────────────────────────────────────

    // Record platform income
    try {
      await Transaction.create({
        userId: user._id,
        type:   "credit",
        amount: paidAmount,
        description: `Card Activation Payment — ${user.name} (${user.mobile})`,
        referenceId: data?.transactionId || txnId,
        category:    "card_activation_payment",
        status:      "success",
      });
    } catch (txnErr) {
      console.error("Activation payment transaction error:", txnErr.message);
    }

    // Referral cashback — only on first-ever activation
    if (user.referredBy) {
      try {
        const referrer = await User.findOne({ referralCode: user.referredBy });
        if (referrer) {
          await Promise.all([
            User.findByIdAndUpdate(user._id,     { $inc: { walletBalance: 50 } }),
            User.findByIdAndUpdate(referrer._id,  { $inc: { walletBalance: 50 } }),
          ]);
          await Transaction.insertMany([
            {
              userId:      user._id,
              type:        "credit",
              amount:      50,
              description: `Referral cashback — Family Card activate kiya (code: ${user.referredBy})`,
              referenceId: user.referredBy,
              category:    "referral_cashback",
              status:      "success",
            },
            {
              userId:      referrer._id,
              type:        "credit",
              amount:      50,
              description: `Referral reward — ${user.name || "User"} ne Family Card activate kiya`,
              referenceId: user._id.toString(),
              category:    "referral_cashback",
              status:      "success",
            },
          ]);
        }
      } catch (refErr) {
        console.error("Referral cashback error:", refErr.message);
      }
    }

    // Coordinator activation commission — ₹100
    if (user.registeredByCoordinator) {
      try {
        const { default: Coordinator } = await import("../../../models/Coordinator.js");
        const coord = await Coordinator.findByIdAndUpdate(
          user.registeredByCoordinator,
          { $inc: { totalEarned: 100, pendingEarned: 100 } },
          { new: true }
        );
        if (coord) {
          await Transaction.create({
            userId:      coord.userId,
            type:        "credit",
            amount:      100,
            description: `Card Activation Commission — ${user.name} (${user.mobile})`,
            referenceId: user._id.toString(),
            category:    "coordinator_commission",
            status:      "success",
          });
        }
      } catch (coordErr) {
        console.error("Coordinator commission error:", coordErr.message);
      }
    }

    let successUrl;
    if (returnUrl?.startsWith("/")) {
      successUrl = `${BASE}${returnUrl}?activated=1&cardNumber=${cardNumber}`;
    } else if (from === "coordinator") {
      successUrl = `${BASE}/dashboard?payment=success&cardNumber=${cardNumber}&from=coordinator`;
    } else {
      successUrl = `${BASE}/dashboard?payment=success&cardNumber=${cardNumber}`;
    }

    return NextResponse.redirect(successUrl);
  } catch (error) {
    console.error("Payment Callback Error:", error);
    return NextResponse.redirect(`${BASE}/dashboard?payment=failed`);
  }
}

export async function GET(request) {
  const url = new URL(request.url);
  return NextResponse.redirect(
    `${process.env.NEXTAUTH_URL}/dashboard?payment=${url.searchParams.get("payment") || "failed"}`
  );
}
