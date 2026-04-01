import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

// 6 digit OTP generate karna
function generateOTP() {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function POST(request) {
  try {
    const { mobile } = await request.json();

    // Mobile number validate karo
    if (!mobile || mobile.length !== 10) {
      return NextResponse.json(
        { success: false, message: "Sahi mobile number daalo (10 digits)" },
        { status: 400 }
      );
    }

    await connectDB();

    // OTP generate karo — 10 minute ke liye valid
    const otp = generateOTP();
    const otpExpiry = new Date(Date.now() + 10 * 60 * 1000);

    // User dhundho — agar nahi hai toh naya banao
    let user = await User.findOne({ mobile });

    if (!user) {
      // Naya user — sirf mobile save karo abhi
      user = await User.create({
        mobile,
        name: "New User",
        age: 0,
        gender: "male",
        otp,
        otpExpiry,
      });
    } else {
      // Purana user — OTP update karo
      user.otp = otp;
      user.otpExpiry = otpExpiry;
      await user.save();
    }

    // Testing ke liye OTP console mein print karo
    console.log(`📱 OTP for ${mobile}: ${otp}`);

    return NextResponse.json({
      success: true,
      message: "OTP bhej diya gaya!",
      // Testing ke liye OTP response mein bhi bhej rahe hain
      // Production mein yeh hataana hoga
      otp: otp,
    });
  } catch (error) {
    console.error("Send OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}