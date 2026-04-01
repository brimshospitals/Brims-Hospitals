import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

// Family Card ki price
const CARD_PRICE = 99900; // 999 rupees in paise

export async function POST(request) {
  try {
    const { userId } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    const user = await User.findById(userId);
    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    // Unique transaction ID
    const transactionId = "BRIMS" + Date.now();

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: CARD_PRICE,
      redirectUrl: `${process.env.NEXTAUTH_URL}/api/payment-callback?txnId=${transactionId}&userId=${userId}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXTAUTH_URL}/api/payment-callback`,
      mobileNumber: user.mobile,
      paymentInstrument: {
        type: "PAY_PAGE",
      },
    };

    // Base64 encode
    const payloadBase64 = Buffer.from(JSON.stringify(payload)).toString("base64");

    // Checksum
    const checksum = crypto
      .createHash("sha256")
      .update(payloadBase64 + "/pg/v1/pay" + SALT_KEY)
      .digest("hex") + "###" + SALT_INDEX;

    // PhonePe API call
    const response = await axios.post(
      "https://api.phonepe.com/apis/hermes/pg/v1/pay",
      { request: payloadBase64 },
      {
        headers: {
          "Content-Type": "application/json",
          "X-VERIFY": checksum,
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

    return NextResponse.json({
      success: true,
      redirectUrl,
      transactionId,
    });
  } catch (error) {
    console.error("PhonePe Error:", error?.response?.data || error.message);
    return NextResponse.json(
      { success: false, message: "Payment error: " + error.message },
      { status: 500 }
    );
  }
}