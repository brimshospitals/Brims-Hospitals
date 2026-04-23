import mongoose from "mongoose";

// Per-hospital, per-service negotiated commission rates.
// Admin sets these after negotiation. Falls back to DEFAULT_COMMISSION if not set.
const commissionSlabSchema = new mongoose.Schema(
  {
    hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    hospitalName: { type: String }, // denormalized

    // Service type rates (null = use platform default)
    rates: {
      OPD:          { type: Number, default: null }, // %
      Lab:          { type: Number, default: null },
      Surgery:      { type: Number, default: null },
      Consultation: { type: Number, default: null },
      IPD:          { type: Number, default: null },
    },

    // Negotiation notes
    notes:        { type: String },
    effectiveFrom:{ type: Date, default: Date.now },
    isActive:     { type: Boolean, default: true },
  },
  { timestamps: true }
);

commissionSlabSchema.index({ hospitalId: 1 }, { unique: true });

const CommissionSlab =
  mongoose.models.CommissionSlab || mongoose.model("CommissionSlab", commissionSlabSchema);
export default CommissionSlab;