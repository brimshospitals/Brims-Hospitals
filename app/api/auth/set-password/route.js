import { NextResponse } from "next/server";
import { createHash } from "crypto";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

function hashPassword(pw) {
  return createHash("sha256").update(pw + process.env.JWT_SECRET).digest("hex");
}

// POST — set/change password for logged-in user
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["doctor", "hospital", "staff", "admin"]);
  if (error) return error;

  try {
    const { password, confirmPassword } = await request.json();

    if (!password || password.length < 6) {
      return NextResponse.json({ success: false, message: "Password minimum 6 characters ka hona chahiye" }, { status: 400 });
    }
    if (password !== confirmPassword) {
      return NextResponse.json({ success: false, message: "Dono passwords match nahi karte" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndUpdate(session.userId, { password: hashPassword(password) });

    return NextResponse.json({ success: true, message: "Password set ho gaya! Ab password se login kar sakte hain." });
  } catch (err) {
    return NextResponse.json({ success: false, message: "Server error: " + err.message }, { status: 500 });
  }
}
