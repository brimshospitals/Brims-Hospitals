import mongoose from "mongoose";

const promoCodeSchema = new mongoose.Schema({
  code:         { type: String, required: true, unique: true, uppercase: true, trim: true },
  description:  { type: String, default: "" },
  discountType: { type: String, enum: ["flat", "percent"], required: true },
  discountValue:{ type: Number, required: true },      // flat = ₹ amount, percent = %
  maxDiscount:  { type: Number, default: null },        // percent caps pe max ₹ limit
  minAmount:    { type: Number, default: 0 },           // minimum booking amount
  usageLimit:   { type: Number, default: null },        // null = unlimited
  usedCount:    { type: Number, default: 0 },
  validFrom:    { type: Date,   default: Date.now },
  validUntil:   { type: Date,   default: null },        // null = no expiry
  applicableOn: { type: [String], default: ["OPD","Lab","Surgery","Consultation"] },
  isActive:     { type: Boolean, default: true },
  createdBy:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
}, { timestamps: true });

const PromoCode = mongoose.models.PromoCode || mongoose.model("PromoCode", promoCodeSchema);
export default PromoCode;
