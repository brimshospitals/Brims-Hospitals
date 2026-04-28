import mongoose from "mongoose";

// BookingDraft — saves user's booking intent at each stage
// Stage 1: Item selected (modal opened)
// Stage 2: Patient selected
// Stage 3: Slot/Date selected
// Stage 4: Payment mode selected (never submitted)
// Status "converted" = actual Booking was created

const bookingDraftSchema = new mongoose.Schema(
  {
    userId:    { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    type:      { type: String, enum: ["OPD", "Lab", "Surgery", "IPD", "Consultation"], required: true },

    // Item reference (doctorId / labTestId / packageId)
    itemId:   { type: mongoose.Schema.Types.ObjectId },
    itemType: { type: String }, // "Doctor" | "LabTest" | "SurgeryPackage"

    // Denormalized for fast display / reminders
    itemName:     { type: String },
    hospitalName: { type: String },
    amount:       { type: Number },

    // Funnel stage (1–4)
    stage: { type: Number, default: 1, min: 1, max: 4 },

    // Stage 2 data
    patientInfo: {
      name:   { type: String },
      mobile: { type: String },
      age:    { type: Number },
      gender: { type: String },
    },

    // Stage 3 data
    slotInfo: {
      date: { type: String },
      slot: { type: String },
    },

    // Stage 4 data
    paymentMode: { type: String },

    // Reminder tracking — avoids sending same reminder twice
    reminderSent: {
      min30: { type: Boolean, default: false },
      hr2:   { type: Boolean, default: false },
      hr24:  { type: Boolean, default: false },
    },

    // Lifecycle
    status:             { type: String, enum: ["active", "converted", "expired"], default: "active", index: true },
    convertedBookingId: { type: String }, // bookingId string when converted

    // Auto-expire after 48 hours (MongoDB TTL index handles cleanup)
    expiresAt: {
      type:    Date,
      default: () => new Date(Date.now() + 48 * 60 * 60 * 1000),
    },
  },
  { timestamps: true }
);

// Compound index for cron queries
bookingDraftSchema.index({ status: 1, createdAt: 1 });
bookingDraftSchema.index({ userId: 1, type: 1, status: 1 });

// TTL index — MongoDB auto-deletes expired documents
bookingDraftSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const BookingDraft =
  mongoose.models.BookingDraft || mongoose.model("BookingDraft", bookingDraftSchema);

export default BookingDraft;
