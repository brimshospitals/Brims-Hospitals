import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import User from "../../../models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { mobile, otp } = await request.json();

    // Validate
    if (!mobile || !otp) {
      return NextResponse.json(
        { success: false, message: "Mobile aur OTP dono chahiye" },
        { status: 400 }
      );
    }

    await connectDB();

    // User dhundho
    const user = await User.findOne({ mobile });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User nahi mila" },
        { status: 404 }
      );
    }

    // OTP check karo
    if (user.otp !== otp) {
      return NextResponse.json(
        { success: false, message: "Galat OTP hai" },
        { status: 400 }
      );
    }

    // OTP expiry check karo
    if (new Date() > user.otpExpiry) {
      return NextResponse.json(
        { success: false, message: "OTP expire ho gaya, dobara bhejein" },
        { status: 400 }
      );
    }

    // OTP sahi hai — clear karo
    user.otp = null;
    user.otpExpiry = null;
    await user.save();

    // Check karo user ne registration complete ki hai ya nahi
    const isNewUser = user.age === 0;

    return NextResponse.json({
      success: true,
      message: "Login successful!",
      isNewUser,
      userId: user._id,
      mobile: user.mobile,
    });
  } catch (error) {
    console.error("Verify OTP Error:", error);
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}