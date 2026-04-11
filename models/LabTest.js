import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    testId: { type: String, unique: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    hospitalName: { type: String },

    name: { type: String, required: true },
    category: {
      type: String,
      enum: [
        "Blood Test",
        "Urine Test",
        "Stool Test",
        "Imaging",
        "ECG",
        "X-Ray",
        "Ultrasound",
        "MRI",
        "CT Scan",
        "Pathology",
        "Other",
      ],
    },
    description: { type: String },
    sampleType: { type: String }, // Blood, Urine, Stool, Swab etc.
    turnaroundTime: { type: String }, // e.g. "Same Day", "24 hours"
    reportDelivery: {
      type: String,
      enum: ["Online", "Physical", "Both"],
      default: "Both",
    },

    // Pricing
    mrp: { type: Number, required: true },
    offerPrice: { type: Number, required: true },
    membershipDiscount: { type: Number, default: 0 }, // %
    membershipPrice: { type: Number },

    // Home collection
    homeCollection: { type: Boolean, default: false },
    homeCollectionCharge: { type: Number, default: 0 },

    // Preparation
    fastingRequired: { type: Boolean, default: false },
    fastingHours: { type: Number },
    preparationNotes: { type: String },

    // Location
    address: {
      district: { type: String },
      city: { type: String },
      state: { type: String, default: "Bihar" },
    },

    // Stats
    totalBookings: { type: Number, default: 0 },
    rating: { type: Number, default: 0 },
    totalReviews: { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LabTest =
  mongoose.models.LabTest || mongoose.model("LabTest", labTestSchema);
export default LabTest;
