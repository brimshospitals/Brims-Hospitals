import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// POST — save FCM token for the logged-in user
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "doctor", "hospital", "staff", "admin"]);
  if (error) return error;

  try {
    const { fcmToken } = await request.json();
    if (!fcmToken) {
      return NextResponse.json({ success: false, message: "fcmToken missing" }, { status: 400 });
    }

    await connectDB();
    await User.findByIdAndUpdate(session.userId, { $set: { fcmToken } });

    return NextResponse.json({ success: true, message: "FCM token saved" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// DELETE — remove FCM token (on logout)
export async function DELETE(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "doctor", "hospital", "staff", "admin"]);
  if (error) return error;

  try {
    await connectDB();
    await User.findByIdAndUpdate(session.userId, { $unset: { fcmToken: 1 } });
    return NextResponse.json({ success: true, message: "FCM token removed" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}