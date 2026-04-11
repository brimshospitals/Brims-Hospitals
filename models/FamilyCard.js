import mongoose from "mongoose";

const familyCardSchema = new mongoose.Schema(
  {
    primaryMemberId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    cardNumber: { type: String, unique: true, required: true },
    members: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    membersCount: { type: Number, default: 1 },
    walletBalance: { type: Number, default: 0 },
    activationDate: { type: Date },
    expiryDate: { type: Date },
    status: {
      type: String,
      enum: ["active", "inactive", "expired"],
      default: "active",
    },
    paymentId: { type: String },
    amountPaid: { type: Number },
  },
  { timestamps: true }
);

const FamilyCard =
  mongoose.models.FamilyCard || mongoose.model("FamilyCard", familyCardSchema);
export default FamilyCard;
