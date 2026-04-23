import mongoose from "mongoose";

// Health Coordinator — local health workers / GPs who refer patients
// Commission: Surgery = 20%, Lab = 30-50% (set per coordinator)
const coordinatorSchema = new mongoose.Schema(
  {
    coordinatorId: { type: String, unique: true }, // BRIMS-HC-XXXX
    userId:        { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    name:     { type: String, required: true },
    mobile:   { type: String, required: true, unique: true },
    email:    { type: String },
    photo:    { type: String },

    // Location
    district: { type: String },
    area:     { type: String }, // mohalla / village / locality

    // Type
    type: {
      type: String,
      enum: ["health_worker", "gp", "pharmacist", "other"],
      default: "health_worker",
    },

    // Commission rates (% of booking amount)
    commissionRates: {
      Surgery:      { type: Number, default: 20 },
      Lab:          { type: Number, default: 30 },
      OPD:          { type: Number, default: 0  },
      Consultation: { type: Number, default: 0  },
      IPD:          { type: Number, default: 10 },
    },

    // Stats (denormalized for quick display)
    totalClients:  { type: Number, default: 0 },
    totalBookings: { type: Number, default: 0 },
    totalEarned:   { type: Number, default: 0 },   // lifetime earnings
    pendingEarned: { type: Number, default: 0 },    // not yet paid
    paidEarned:    { type: Number, default: 0 },    // already transferred

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Coordinator =
  mongoose.models.Coordinator || mongoose.model("Coordinator", coordinatorSchema);
export default Coordinator;