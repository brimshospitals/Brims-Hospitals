import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";
import { getSession } from "../../../lib/auth";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";
const CARD_PRICE  = 24900; // ₹249 in paise

export async function POST(request) {
  try {
    // ── Auth: verify session ──────────────────────────────────────────────────
    const session = await getSession(request);
    if (!session) {
      return NextResponse.json(
        { success: false, message: "Login zaruri hai" },
        { status: 401 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    const { userId, returnUrl } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID chahiye" },
        { status: 400 }
      );
    }

    // ── Ownership check ───────────────────────────────────────────────────────
    if (session.userId.toString() !== userId.toString()) {
      return NextResponse.json(
        { success: false, message: "Aap doosre user ke liye card activate nahi kar sakte" },
        { status: 403 }
      );
    }
    // ─────────────────────────────────────────────────────────────────────────

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    // ── Guard: already has an active card → use renew instead ─────────────────
    if (user.familyCardId) {
      const existingCard = await FamilyCard.findById(user.familyCardId).lean();
      if (existingCard && existingCard.status === "active" && existingCard.expiryDate > new Date()) {
        return NextResponse.json(
          {
            success: false,
            message: "Aapka Family Card already active hai. Renewal ke liye Renew Card use karein.",
          },
          { status: 400 }
        );
      }
    }
    // ─────────────────────────────────────────────────────────────────────────

    const transactionId = "BRIMS" + Date.now();

    const callbackParams = new URLSearchParams({ txnId: transactionId, userId });
    if (returnUrl) callbackParams.set("returnUrl", returnUrl);

    const payload = {
      merchantId:            MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId:        userId,
      amount:                CARD_PRICE,
      redirectUrl: `${process.env.NEXTAUTH_URL}/api/payment-callback?${callbackParams.toString()}`,
      redirectMode: "POST",
      callbackUrl:  `${process.env.NEXTAUTH_URL}/api/payment-callback`,
      mobileNumber: user.mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum =
      crypto.createHash("sha256")
        .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
        .digest("hex") +
      "###" + SALT_INDEX;

    const response = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY":     checksum,
        },
      }
    );

    const redirectUrl = response.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      return NextResponse.json(
        { success: false, message: "Payment URL nahi mila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, redirectUrl, transactionId });
  } catch (error) {
    console.error("PhonePe Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: "Payment error: " + error.message },
      { status: 500 }
    );
  }
}
