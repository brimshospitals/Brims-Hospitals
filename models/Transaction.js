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
  referenceId: {
    type: String,    // booking ID string, UTR number, card number, etc.
  },
  category: {
    type: String,
    enum: [
      // ── Platform Income (money received by platform) ──────────────────────
      "card_activation_payment",   // ₹249 card activation via PhonePe
      "booking_payment",           // full booking payment online
      "booking_advance",           // advance/deposit for surgery/IPD
      "platform_charge",           // periodic charges from hospital/lab/doctor
      "wallet_topup",              // user wallet top-up (platform holds)
      // ── Platform Expenses (money paid out by platform) ────────────────────
      "coordinator_commission",    // coordinator commission (card or booking)
      "referral_cashback",         // ₹50 cashback to referrer/referee
      "pickup_charge",             // home sample collection charge
      "expense",                   // admin-recorded miscellaneous expense
      "wallet_refund",             // booking cancellation refund to wallet
      // ── Partner Payouts (platform paying hospital / lab / doctor) ──────────
      "hospital_payout",           // platform paying hospital after booking
      "lab_payout",                // platform paying lab after test
      "doctor_payout",             // platform paying doctor after consultation
      "ambulance_payout",          // platform paying ambulance provider
      // ── Legacy (kept for backward compatibility) ──────────────────────────
      "wallet",
      "card_activation",           // legacy coordinator card commission
      "booking_commission",        // legacy coordinator booking commission
      "referral",                  // legacy referral cashback
      "other",
      "withdrawal",
    ],
    default: "other",
  },
  status: {
    type: String,
    enum: ["pending", "success", "failed"],
    default: "success",
  },
}, { timestamps: true });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", transactionSchema);
export default Transaction;