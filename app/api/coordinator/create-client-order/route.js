import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY    = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX  = process.env.PHONEPE_SALT_INDEX || "1";
const CARD_PRICE  = 24900; // ₹249 in paise

// Coordinator initiates Family Card activation for a registered client
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["coordinator", "member", "admin"]);
  if (error) return error;

  try {
    const { clientUserId } = await request.json();
    if (!clientUserId) {
      return NextResponse.json({ success: false, message: "clientUserId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    // Verify client exists and doesn't already have an active card
    const client = await User.findById(clientUserId).populate("familyCardId");
    if (!client) {
      return NextResponse.json({ success: false, message: "Client nahi mila" }, { status: 404 });
    }
    if (client.familyCardId && client.familyCardId.status === "active") {
      return NextResponse.json({ success: false, message: "Is client ka card pehle se active hai" }, { status: 409 });
    }

    const transactionId = "BRIMS" + Date.now();
    const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL;

    const payload = {
      merchantId:            MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId:        clientUserId,
      amount:                CARD_PRICE,
      redirectUrl:  `${baseUrl}/api/payment-callback?txnId=${transactionId}&userId=${clientUserId}&from=coordinator`,
      redirectMode: "POST",
      callbackUrl:  `${baseUrl}/api/payment-callback`,
      mobileNumber: client.mobile,
      paymentInstrument: { type: "PAY_PAGE" },
    };

    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");
    const checksum = crypto
      .createHash("sha256")
      .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
      .digest("hex") + "###" + SALT_INDEX;

    const response = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      { headers: { "Content-Type": "application/json", "X-VERIFY": checksum } }
    );

    const redirectUrl = response.data?.data?.instrumentResponse?.redirectInfo?.url;
    if (!redirectUrl) {
      return NextResponse.json({ success: false, message: "Payment URL nahi mila" }, { status: 500 });
    }

    return NextResponse.json({ success: true, redirectUrl, transactionId });
  } catch (err) {
    console.error("Coordinator create-client-order error:", err?.response?.data || err.message);
    return NextResponse.json({ success: false, message: "Payment error: " + err.message }, { status: 500 });
  }
}
