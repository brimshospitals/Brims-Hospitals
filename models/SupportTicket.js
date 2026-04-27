import mongoose from "mongoose";

const messageSchema = new mongoose.Schema({
  senderId:   { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  senderName: { type: String },
  senderRole: { type: String },
  message:    { type: String, required: true },
  createdAt:  { type: Date, default: Date.now },
}, { _id: true });

const supportTicketSchema = new mongoose.Schema({
  ticketId:   { type: String, unique: true },  // TKT-00001
  userId:     { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  bookingRef: { type: String },                // e.g. "BH-OPD-00008" (optional)

  category: {
    type: String,
    enum: ["booking", "payment", "cancellation", "service", "home_collection", "report", "account", "other"],
    required: true,
  },
  subject:     { type: String, required: true, trim: true },
  description: { type: String, required: true, trim: true },

  status: {
    type: String,
    enum: ["open", "in_progress", "resolved", "closed"],
    default: "open",
  },
  priority: {
    type: String,
    enum: ["low", "medium", "high", "urgent"],
    default: "medium",
  },

  messages: [messageSchema],   // conversation thread

  assignedTo:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  assignedName: { type: String },
  resolvedAt:   { type: Date },
}, { timestamps: true });

const SupportTicket = mongoose.models.SupportTicket || mongoose.model("SupportTicket", supportTicketSchema);
export default SupportTicket;
