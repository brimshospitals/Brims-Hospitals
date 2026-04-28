import { NextResponse } from "next/server";
import crypto from "crypto";
import axios from "axios";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

const MERCHANT_ID = process.env.PHONEPE_MERCHANT_ID;
const SALT_KEY = process.env.PHONEPE_SALT_KEY;
const SALT_INDEX = process.env.PHONEPE_SALT_INDEX || "1";

export async function POST(request) {
  try {
    const { userId, amount } = await request.json();

    if (!userId || !amount || amount < 10) {
      return NextResponse.json(
        { success: false, message: "userId aur minimum ₹10 chahiye" },
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

    const transactionId = "WALLET" + Date.now();
    const amountInPaise = amount * 100;

    const payload = {
      merchantId: MERCHANT_ID,
      merchantTransactionId: transactionId,
      merchantUserId: userId,
      amount: amountInPaise,
      redirectUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/wallet/callback?txnId=${transactionId}&userId=${userId}&amount=${amount}`,
      redirectMode: "POST",
      callbackUrl: `${process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXTAUTH_URL}/api/wallet/callback`,
      mobileNumber: user.mobile,
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
      return NextResponse.json(
        { success: false, message: "Payment URL nahi mila" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, redirectUrl, transactionId });

  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Payment error: " + error.message },
      { status: 500 }
    );
  }
}