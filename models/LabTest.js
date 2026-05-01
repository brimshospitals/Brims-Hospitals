import mongoose from "mongoose";

const labTestSchema = new mongoose.Schema(
  {
    testId: { type: String, unique: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    hospitalName: { type: String },

    // Linked reporting template (optional — for auto-creating LabReport on booking confirm)
    templateId: { type: mongoose.Schema.Types.ObjectId, ref: "LabTemplate" },

    // Test type: single test OR package of multiple tests
    type: { type: String, enum: ["single", "package"], default: "single" },

    name: { type: String, required: true },

    // Department grouping (Haematology, Biochemistry, etc.)
    labDepartment: { type: String },

    category: {
      type: String,
      enum: [
        "Blood Test","Urine Test","Stool Test","Imaging","ECG",
        "X-Ray","Ultrasound","MRI","CT Scan","Pathology","Other",
      ],
    },

    // For packages: list of included test names
    packageTests: [{ type: String }],

    description: { type: String },
    sampleType:  { type: String }, // Blood, Urine, Stool, Swab etc.

    // Reporting time
    turnaroundTime: { type: String }, // e.g. "Same Day", "4 Hours"

    reportDelivery: {
      type: String,
      enum: ["Online", "Physical", "Both"],
      default: "Both",
    },

    // Accreditation
    accreditation: [{ type: String }], // NABL, ISO 15189, JCI, CAP, NABH

    // Test indication (which diseases/conditions it's relevant for)
    indication: [{ type: String }], // Diabetes, CVD, Arthritis, Thyroid, etc.

    // Pricing
    mrp:                { type: Number, required: true },
    offerPrice:         { type: Number, required: true },
    membershipDiscount: { type: Number, default: 0 }, // %
    membershipPrice:    { type: Number },

    // Home collection
    homeCollection:           { type: Boolean, default: false },
    homeCollectionCharge:     { type: Number,  default: 0 },
    memberHomeCollectionFree: { type: Boolean, default: false }, // free HC for members

    // Preparation
    fastingRequired:   { type: Boolean, default: false },
    fastingHours:      { type: Number },
    preparationNotes:  { type: String },

    // Location (defaults from hospital address)
    address: {
      district: { type: String },
      city:     { type: String },
      state:    { type: String, default: "Bihar" },
    },
    // Actual GPS coordinates (from hospital record; falls back to district centroid if absent)
    coordinates: {
      lat: { type: Number },
      lng: { type: Number },
    },

    // Stats
    totalBookings: { type: Number, default: 0 },
    rating:        { type: Number, default: 0 },
    totalReviews:  { type: Number, default: 0 },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const LabTest =
  mongoose.models.LabTest || mongoose.model("LabTest", labTestSchema);
export default LabTest;