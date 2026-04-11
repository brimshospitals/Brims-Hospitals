import { NextResponse } from "next/server";
import connectDB    from "../../../lib/mongodb";
import Notification from "../../../models/Notification";

export const dynamic = "force-dynamic";

/* ── GET — fetch notifications for a user ── */
export async function GET(request) {
  try {
    const { searchParams } = new URL(request.url);
    const userId     = searchParams.get("userId");
    const unreadOnly = searchParams.get("unreadOnly") === "true";
    const limit      = parseInt(searchParams.get("limit") || "20");

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    const query = { userId };
    if (unreadOnly) query.isRead = false;

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit)
      .populate("articleId", "title");

    const unreadCount = await Notification.countDocuments({ userId, isRead: false });

    return NextResponse.json({ success: true, notifications, unreadCount });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

/* ── PATCH — mark notifications as read ── */
export async function PATCH(request) {
  try {
    const { userId, notificationId } = await request.json();

    if (!userId) {
      return NextResponse.json({ success: false, message: "userId zaruri hai" }, { status: 400 });
    }

    await connectDB();

    if (notificationId) {
      // Mark single notification
      await Notification.findByIdAndUpdate(notificationId, { isRead: true });
    } else {
      // Mark all as read for this user
      await Notification.updateMany({ userId, isRead: false }, { isRead: true });
    }

    return NextResponse.json({ success: true, message: "Marked as read" });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
