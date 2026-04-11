import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema(
  {
    bookingId: { type: String, unique: true },
    type: {
      type: String,
      enum: ["OPD", "IPD", "Lab", "Surgery", "Consultation"],
      required: true,
    },
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    memberId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor" },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    packageId: { type: mongoose.Schema.Types.ObjectId, ref: "SurgeryPackage" },
    labTestId: { type: mongoose.Schema.Types.ObjectId, ref: "LabTest" },
    appointmentDate: { type: Date },
    slot: { type: String },
    roomType: { type: String },
    status: {
      type: String,
      enum: ["pending", "confirmed", "completed", "cancelled"],
      default: "pending",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "refunded"],
      default: "pending",
    },
    amount: { type: Number },
    paymentId: { type: String },
    notes: { type: String },
    familyCardId: { type: mongoose.Schema.Types.ObjectId, ref: "FamilyCard" },
  },
  { timestamps: true }
);

const Booking = mongoose.models.Booking || mongoose.model("Booking", bookingSchema);
export default Booking;
