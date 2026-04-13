import mongoose from "mongoose";

const ambulanceRequestSchema = new mongoose.Schema(
  {
    requestId:   { type: String, unique: true },  // AMB-00001
    userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User" },

    // Patient / caller info
    callerName:  { type: String, required: true },
    callerMobile:{ type: String, required: true },
    patientName: { type: String },
    patientAge:  { type: Number },
    patientGender:{ type: String },

    // Emergency details
    emergency:   { type: String },    // brief description
    vehicleType: {
      type: String,
      enum: ["Basic", "Advanced", "ICU", "Neonatal"],
      default: "Basic",
    },

    // Location
    address:     { type: String, required: true },  // typed address
    landmark:    { type: String },
    district:    { type: String, default: "Patna" },
    lat:         { type: Number },
    lng:         { type: Number },

    // Destination hospital (optional)
    destinationHospital: { type: String },

    // Status
    status: {
      type: String,
      enum: ["pending", "dispatched", "arrived", "completed", "cancelled"],
      default: "pending",
    },
    assignedDriver:  { type: String },
    vehicleNumber:   { type: String },
    estimatedETA:    { type: String },   // "10-15 mins"
    dispatchedAt:    { type: Date },
    completedAt:     { type: Date },

    // Charges
    amount: { type: Number, default: 0 },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid"],
      default: "pending",
    },

    adminNotes: { type: String },
  },
  { timestamps: true }
);

ambulanceRequestSchema.index({ status: 1, createdAt: -1 });
ambulanceRequestSchema.index({ callerMobile: 1 });

const AmbulanceRequest =
  mongoose.models.AmbulanceRequest ||
  mongoose.model("AmbulanceRequest", ambulanceRequestSchema);

export default AmbulanceRequest;
