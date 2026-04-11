import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";

export const dynamic = "force-dynamic";

export async function POST(request) {
  try {
    const { mobile, adminKey } = await request.json();

    if (!mobile || !adminKey) {
      return NextResponse.json(
        { success: false, message: "Mobile number aur Admin Key dono zaruri hain" },
        { status: 400 }
      );
    }

    // Secret key verify karo
    if (adminKey !== process.env.ADMIN_KEY) {
      return NextResponse.json(
        { success: false, message: "Galat Admin Key. Dobara check karein." },
        { status: 403 }
      );
    }

    await connectDB();

    const user = await User.findOne({ mobile: mobile.toString().trim() });
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Is mobile number se koi account nahi mila. Pehle register karein." },
        { status: 404 }
      );
    }

    // Promote to admin if not already
    if (user.role !== "admin") {
      user.role = "admin";
      await user.save();
    }

    return NextResponse.json({
      success: true,
      message: `Welcome, ${user.name}! Admin panel access mil gaya.`,
      adminId: user._id.toString(),
      name: user.name,
    });
  } catch (error) {
    return NextResponse.json(
      { success: false, message: "Server error: " + error.message },
      { status: 500 }
    );
  }
}
