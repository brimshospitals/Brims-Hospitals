import mongoose from "mongoose";

const familyCardSchema = new mongoose.Schema({
  primaryMemberId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  cardNumber: {
    type: String,
    unique: true,
    required: true,
  },
  members: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
  }],
  membersCount: { type: Number, default: 1, max: 6 },
  walletBalance: { type: Number, default: 0 },
  activationDate: {
    type: Date,
    default: Date.now,
  },
  expiryDate: {
    type: Date,
    required: true,
  },
  status: {
    type: String,
    enum: ["active", "expired", "pending"],
    default: "pending",
  },
  paymentId: { type: String },
  amountPaid: { type: Number, required: true },
}, { timestamps: true });

const FamilyCard = mongoose.models.FamilyCard || mongoose.model("FamilyCard", familyCardSchema);
export default FamilyCard;