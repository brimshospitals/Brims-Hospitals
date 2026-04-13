import mongoose from "mongoose";

// Stores per-booking commission record.
// Created automatically when a booking is marked "completed" or "paid".
const commissionSchema = new mongoose.Schema(
  {
    bookingId:    { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
    bookingRef:   { type: String },   // BH-OPD-xxxxx
    hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    hospitalName: { type: String },
    doctorId:     { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    type:         { type: String },   // OPD | Lab | Surgery | Consultation

    grossAmount:  { type: Number, default: 0 },  // Total charged to patient
    commissionPct:{ type: Number, default: 10 },  // Brims % (configurable per hospital/type)
    commissionAmt:{ type: Number, default: 0 },   // grossAmount * commissionPct / 100
    hospitalAmt:  { type: Number, default: 0 },   // grossAmount - commissionAmt

    payoutStatus: {
      type: String,
      enum: ["pending", "paid", "on_hold"],
      default: "pending",
    },
    payoutDate:   { type: Date },
    payoutRef:    { type: String },   // Bank transfer ref / UPI ID
    notes:        { type: String },
  },
  { timestamps: true }
);

commissionSchema.index({ hospitalId: 1, payoutStatus: 1, createdAt: -1 });
commissionSchema.index({ bookingId: 1 }, { unique: true });

const Commission =
  mongoose.models.Commission || mongoose.model("Commission", commissionSchema);
export default Commission;
