import mongoose from "mongoose";

const transactionSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  familyCardId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "FamilyCard",
    required: false,
    default: null,
  },
  type: {
    type: String,
    enum: ["credit", "debit"],
    required: true,
  },
  amount: {
    type: Number,
    required: true,
  },
  description: {
    type: String,
    required: true,
  },
  bookingId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Booking",
  },
  paymentId: {
    type: String,
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "success",
  },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
export default Transaction;