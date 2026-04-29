import mongoose from "mongoose";

const surgeryPackageSchema = new mongoose.Schema({
  packageId: { type: String, unique: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  hospitalName: { type: String },

  // Package Basic Info
  name: { type: String, required: true },
  category: { type: String }, // e.g. "General Surgery", "Laparoscopic", "Cardiac"
  description: { type: String },
  inclusions: [{ type: String }], // Kya kya included hai

  // Pricing
  mrp: { type: Number, required: true },
  offerPrice: { type: Number, required: true },
  membershipDiscount: { type: Number, default: 0 }, // % discount for card holders
  membershipPrice: { type: Number }, // Final price after membership discount

  // Room Details
  roomType: {
    type: String,
    enum: ["General", "Semi-Private", "Private", "Deluxe", "Suite"],
    default: "General",
  },
  roomOptions: [{ // Multiple room options with prices
    type: { type: String },
    extraCharge: { type: Number, default: 0 },
  }],
  stayDays: { type: Number }, // Approximate stay in days
  foodIncluded: { type: Boolean, default: false },
  foodDetails: { type: String }, // e.g. "Vegetarian meals 3 times/day"

  // Surgeon Details
  surgeonName: { type: String },
  surgeonDegrees: [{ type: String }],
  surgeonExperience: { type: Number },
  surgeonPhoto: { type: String },

  // Logistics
  pickupFromHome: { type: Boolean, default: false },
  pickupCharge: { type: Number, default: 0 },
  dropAvailable: { type: Boolean, default: false },

  // Pre/Post Surgery
  preSurgeryTests: [{ type: String }], // Tests included
  postCareIncluded: { type: Boolean, default: false },
  followUpConsultations: { type: Number, default: 0 },

  // Media
  photos: [{ type: String }], // Cloudinary URLs
  roomPhotos: [{ type: String }],

  // Location
  address: {
    district: { type: String },
    city: { type: String },
    state: { type: String, default: "Bihar" },
  },
  // Actual GPS coordinates (from hospital record; falls back to district centroid if absent)
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },

  // Stats
  totalBookings: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },

  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const SurgeryPackage = mongoose.models.SurgeryPackage ||
  mongoose.model("SurgeryPackage", surgeryPackageSchema);
export default SurgeryPackage;