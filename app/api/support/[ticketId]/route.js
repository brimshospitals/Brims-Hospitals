import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SupportTicket from "../../../../models/SupportTicket";
import Notification from "../../../../models/Notification";
import User from "../../../../models/User";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

// GET — full ticket detail including message thread
export async function GET(request, { params }) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "staff", "coordinator"]);
  if (error) return error;

  try {
    await connectDB();
    const { ticketId } = await params;

    const ticket = await SupportTicket.findOne({ ticketId }).lean();
    if (!ticket) return NextResponse.json({ success: false, message: "Ticket nahi mila" }, { status: 404 });

    // Users can only see their own tickets; admin/staff can see all
    if (!["admin", "staff"].includes(session.role) && ticket.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    return NextResponse.json({ success: true, ticket });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — add a reply to a ticket (user or admin/staff)
export async function PATCH(request, { params }) {
  const { error, session } = await requireAuth(request, ["user", "member", "admin", "staff", "coordinator"]);
  if (error) return error;

  try {
    await connectDB();
    const { ticketId } = await params;
    const { message, status, priority } = await request.json();

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) return NextResponse.json({ success: false, message: "Ticket nahi mila" }, { status: 404 });

    // Users can only update their own tickets
    if (!["admin", "staff"].includes(session.role) && ticket.userId.toString() !== session.userId) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 });
    }

    // Add reply message
    if (message?.trim()) {
      ticket.messages.push({
        senderId:   session.userId,
        senderName: session.name || session.role,
        senderRole: session.role,
        message:    message.trim(),
      });
    }

    // Admin/staff can update status and priority
    if (["admin", "staff"].includes(session.role)) {
      if (status) {
        ticket.status = status;
        if (status === "resolved" || status === "closed") {
          ticket.resolvedAt = new Date();
        }
      }
      if (priority) ticket.priority = priority;
    }

    await ticket.save();

    // Notify the other party
    try {
      if (["admin", "staff"].includes(session.role)) {
        // Admin replied → notify the user who raised the ticket
        await Notification.create({
          userId:  ticket.userId,
          type:    "support",
          title:   `💬 Support Reply — ${ticketId}`,
          message: `Team ne aapke ticket ka jawab diya: "${message?.trim()?.slice(0, 80)}"`,
        });
      } else {
        // User replied → notify admins
        const admins = await User.find({ role: "admin" }).select("_id").lean();
        if (admins.length > 0) {
          await Notification.insertMany(admins.map(a => ({
            userId:  a._id,
            type:    "support",
            title:   `💬 Ticket Reply — ${ticketId}`,
            message: `${session.name || "User"}: "${message?.trim()?.slice(0, 80)}"`,
          })));
        }
      }
    } catch {}

    return NextResponse.json({
      success: true,
      message: "Reply bhej diya gaya",
      ticket,
    });
  } catch (err) {
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
