import { NextResponse } from "next/server";
import connectDB from "../../../../lib/mongodb";
import SupportTicket from "../../../../models/SupportTicket";
import Notification from "../../../../models/Notification";
import { requireAuth } from "../../../../lib/auth";

export const dynamic = "force-dynamic";

const VALID_STATUSES   = ["open", "in_progress", "resolved", "closed"];
const VALID_PRIORITIES = ["low", "medium", "high", "urgent"];

// Escape special regex characters to prevent injection
function escapeRegex(str) {
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// GET — admin: all tickets with filters + stats
// ?status=open|in_progress|resolved|closed|all
// ?category=booking|payment|...
// ?priority=urgent|high|medium|low
// ?search=TKT-00001 or name
// ?page=1
export async function GET(request) {
  const { error } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    await connectDB();

    const { searchParams } = new URL(request.url);
    const status   = searchParams.get("status")   || "all";
    const category = searchParams.get("category") || "all";
    const priority = searchParams.get("priority") || "all";
    const search   = searchParams.get("search")   || "";
    let page       = parseInt(searchParams.get("page") || "1", 10);
    if (isNaN(page) || page < 1) page = 1;
    const limit    = 30;

    const query = {};
    if (status   !== "all") query.status   = status;
    if (category !== "all") query.category = category;
    if (priority !== "all") query.priority = priority;
    if (search.trim()) {
      const escaped = escapeRegex(search.trim());
      query.$or = [
        { ticketId:   { $regex: escaped, $options: "i" } },
        { subject:    { $regex: escaped, $options: "i" } },
        { bookingRef: { $regex: escaped, $options: "i" } },
      ];
    }

    const [total, tickets, statsAgg] = await Promise.all([
      SupportTicket.countDocuments(query),
      SupportTicket.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .populate("userId", "name mobile")
        .select("-messages")
        .lean(),
      // Stats always reflect global counts (sidebar badges must show all, not filtered)
      SupportTicket.aggregate([
        { $group: { _id: "$status", count: { $sum: 1 } } },
      ]),
    ]);

    const stats = { open: 0, in_progress: 0, resolved: 0, closed: 0 };
    statsAgg.forEach(s => { if (s._id in stats) stats[s._id] = s.count; });

    return NextResponse.json({
      success: true,
      tickets,
      total,
      pages: Math.ceil(total / limit),
      page,
      stats,
    });
  } catch (err) {
    console.error("Admin support GET error:", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}

// PATCH — admin: update ticket (status, priority, reply, assign)
// body: { ticketId, message?, status?, priority?, assignedName? }
export async function PATCH(request) {
  const { error, session } = await requireAuth(request, ["admin", "staff"]);
  if (error) return error;

  try {
    await connectDB();

    const { ticketId, message, status, priority, assignedName } = await request.json();
    if (!ticketId) return NextResponse.json({ success: false, message: "ticketId required" }, { status: 400 });

    // Enum validation
    if (status && !VALID_STATUSES.includes(status)) {
      return NextResponse.json({ success: false, message: `Invalid status: ${status}` }, { status: 400 });
    }
    if (priority && !VALID_PRIORITIES.includes(priority)) {
      return NextResponse.json({ success: false, message: `Invalid priority: ${priority}` }, { status: 400 });
    }

    const ticket = await SupportTicket.findOne({ ticketId });
    if (!ticket) return NextResponse.json({ success: false, message: "Ticket nahi mila" }, { status: 404 });

    if (message?.trim()) {
      ticket.messages.push({
        senderId:   session.userId,
        senderName: session.name || "Support Team",
        senderRole: session.role,
        message:    message.trim(),
      });
    }

    if (status) {
      ticket.status = status;
      if (status === "resolved") ticket.resolvedAt = new Date();
      if (status === "closed")   ticket.closedAt   = new Date();
    }
    if (priority) ticket.priority = priority;

    // Use session name/id — never trust user-supplied assignedName
    if (assignedName !== undefined) {
      ticket.assignedTo   = session.userId;
      ticket.assignedName = session.name || "Support Team";
    }

    // Auto-mark in_progress only when ticket is still open
    if (message?.trim() && ticket.status === "open") {
      ticket.status = "in_progress";
    }

    await ticket.save();

    // Notify user
    try {
      const notifMsg = message?.trim()
        ? `Team ka jawab: "${message.trim().slice(0, 80)}"`
        : `Aapke ticket ka status update hua: ${status || ticket.status}`;

      await Notification.create({
        userId:  ticket.userId,
        type:    "support",
        title:   `💬 Support Update — ${ticketId}`,
        message: notifMsg,
      });
    } catch (notifErr) {
      console.error("Admin support notification failed:", notifErr.message);
    }

    return NextResponse.json({ success: true, message: "Ticket updated", ticket });
  } catch (err) {
    console.error("Admin support PATCH error:", err.message);
    return NextResponse.json({ success: false, message: err.message }, { status: 500 });
  }
}
