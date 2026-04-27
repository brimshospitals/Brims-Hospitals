import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SupportTicket from "../../../models/SupportTicket";
import Notification from "../../../models/Notification";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

async function generateTicketId() {
  const count = await SupportTicket.countDocuments();
  return `TKT-${String(count + 1).padStart(5, "0")}`;
}

// POST — user creates a new support ticket
export async function POST(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "coordinator"]);
  if (error) return error;

  try {
    await connectDB();

    const { category, subject, description, bookingRef } = await request.json();

    if (!category || !subject?.trim() || !description?.trim()) {
      return NextResponse.json({ success: false, message: "Category, subject aur description required hai" }, { status: 400 });
    }

    const ticketId = await generateTicketId();

    const ticket = await SupportTicket.create({
      ticketId,
      userId:      session.userId,
      category,
      subject:     subject.trim(),
      description: description.trim(),
      bookingRef:  bookingRef?.trim() || undefined,
      messages: [{
        senderId:   session.userId,
        senderName: session.name || "User",
        senderRole: session.role,
        message:    description.trim(),
      }],
    });

    // Notify all admin users
    try {
      const admins = await User.find({ role: "admin" }).select("_id").lean();
      if (admins.length > 0) {
        await Notification.insertMany(admins.map(a => ({
          userId:  a._id,
          type:    "support",
          title:   `📨 Naya Support Ticket — ${ticketId}`,
          message: `${session.name || "User"} | ${category} | ${subject.trim()}`,
        })));
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: `Ticket ${ticketId} submit ho gaya — hum jald contact karenge`,
      ticketId,
      ticket,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// GET — logged-in user's own tickets
export async function GET(request) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "coordinator"]);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get("status") || "all";
    const page   = parseInt(searchParams.get("page") || "1", 10);
    const limit  = 20;

    const query = { userId: session.userId };
    if (status !== "all") query.status = status;

    const [total, tickets] = await Promise.all([
      SupportTicket.countDocuments(query),
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-messages")   // exclude thread for list view
        .lean(),
    ]);

    return NextResponse.json({
      success: true,
      tickets,
      total,
      pages: Math.ceil(total / limit),
      page,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
