import { NextResponse } from "next/server";
import connectDB from "../../../lib/mongodb";
import SupportTicket from "../../../models/SupportTicket";
import Notification from "../../../models/Notification";
import User from "../../../models/User";
import { requireAuth } from "../../../lib/auth";

export const dynamic = "force-dynamic";

// Atomic-safe ticket ID: use the latest ticket's ID as base, retry on duplicate key
async function generateTicketId() {
  const last = await SupportTicket.findOne({}, { ticketId: 1 })
    .sort({ createdAt: -1 }).lean();
  if (!last?.ticketId) return "TKT-00001";
  const m = last.ticketId.match(/^TKT-(\d+)$/);
  const num = m ? parseInt(m[1], 10) : 0;
  return `TKT-${String(num + 1).padStart(5, "0")}`;
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

    // Enum validation
    const VALID_CATEGORIES = ["booking","payment","cancellation","service","home_collection","report","account","other"];
    if (!VALID_CATEGORIES.includes(category)) {
      return NextResponse.json({ success: false, message: "Invalid category" }, { status: 400 });
    }

    // Length validation
    if (subject.trim().length > 120) {
      return NextResponse.json({ success: false, message: "Subject 120 characters se zyada nahi ho sakta" }, { status: 400 });
    }
    if (description.trim().length > 5000) {
      return NextResponse.json({ success: false, message: "Description 5000 characters se zyada nahi ho sakta" }, { status: 400 });
    }

    // Create with duplicate-key retry to handle rare race condition
    let ticket;
    let ticketId;
    let attempts = 0;
    while (attempts < 3) {
      ticketId = await generateTicketId();
      try {
        ticket = await SupportTicket.create({
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
        break;
      } catch (e) {
        if (e.code === 11000 && attempts < 2) { attempts++; continue; }
        throw e;
      }
    }

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
    } catch (notifErr) {
      console.error("Support ticket notification failed:", notifErr.message);
    }

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
    let page  = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
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
    console.error("Support GET error:", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
