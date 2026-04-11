import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    type:      { type: String, enum: ["article", "booking", "system"], default: "article" },
    title:     { type: String, required: true },
    message:   { type: String, default: "" },
    articleId: { type: mongoose.Schema.Types.ObjectId, ref: "Article" },
    isRead:    { type: Boolean, default: false },
  },
  { timestamps: true }
);

// Index for fast per-user queries
notificationSchema.index({ userId: 1, isRead: 1, createdAt: -1 });

const Notification =
  mongoose.models.Notification || mongoose.model("Notification", notificationSchema);
export default Notification;
