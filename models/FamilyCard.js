import mongoose from "mongoose";

const familyCardSchema = new mongoose.Schema(
  {
    primaryMemberId: {
      type:     mongoose.Schema.Types.ObjectId,
      ref:      "User",
      required: true,
      index:    true,
    },
    cardNumber:   { type: String, unique: true, required: true },
    members:      [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    membersCount: { type: Number, default: 1 },
    walletBalance: { type: Number, default: 0 },
    activationDate: { type: Date },
    expiryDate:     { type: Date, index: true },
    status: {
      type:    String,
      enum:    ["active", "inactive", "expired"],
      default: "active",
      index:   true,
    },
    paymentId:  { type: String },
    amountPaid: { type: Number },
  },
  { timestamps: true }
);

// Keep membersCount in sync with members array automatically
familyCardSchema.pre("save", function (next) {
  if (this.isModified("members")) {
    this.membersCount = this.members.length;
  }
  next();
});

// Auto-expire cards when expiryDate has passed (checked on read via family/get)
// For bulk queries, use: status: "active", expiryDate: { $gt: new Date() }

const FamilyCard =
  mongoose.models.FamilyCard || mongoose.model("FamilyCard", familyCardSchema);
export default FamilyCard;
