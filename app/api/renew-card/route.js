import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";
import FamilyCard from "../../../models/FamilyCard";

export const dynamic = "force-dynamic";

const MERCHANT_ID  = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY     = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX   = process.env.PHONEPE_SALT_INDEX || "1";
const BASE_URL     = process.env.NEXT_PUBLIC_BASE_URL;

const CARD_PRICE = 24900; // ₹249 in paise

export async function POST(request) {
  try {
    const { userId } = await request.json();
    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const user = await User.findById(userId).lean();
    if (!user) {
      return NextResponse.json({ success: false, message: "User nahi mila" }, { status: 404 });
    }

    const familyCard = await FamilyCard.findById(user.familyCardId);
    if (!familyCard) {
      return NextResponse.json(
        { success: false, message: "Pehle Family Card activate karein" },
        { status: 400 }
      );
    }

    const transactionId = "RENEW" + Date.now();

    const payload = {
      merchantId:            MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId:        userId,
      amount:                CARD_PRICE,
      redirectUrl:           `${BASE_URL}/api/renew-callback?txnId=${transactionId}&userId=${userId}&cardId=${familyCard._id}`,
      redirectMode:          "POST",
      callbackUrl:           `${BASE_URL}/api/renew-callback`,
      mobileNumber:          user.mobile,
      paymentInstrument:     { type: "PAY_PAGE" },
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
  } catch (error) {
    console.error("Renew Card Error:", error?.response?.data || error.message);
    return NextResponse.json({ success: false, message: "Payment error: " + error.message }, { status: 500 });
  }
}
