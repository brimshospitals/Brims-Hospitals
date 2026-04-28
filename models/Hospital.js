import mongoose from "mongoose";

const hospitalSchema = new mongoose.Schema({
  hospitalId: { type: String, unique: true },
  // Auth link — hospital User account
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  name: { type: String, required: true },
  address: {
    street: { type: String },
    district: { type: String },
    city: { type: String },
    state: { type: String, default: "Bihar" },
    pincode: { type: String },
  },
  mobile: { type: String },
  website: { type: String },
  email: { type: String },
  spocName: { type: String },
  spocContact: { type: String },
  ownerName:    { type: String },
  ownerContact: { type: String },
  registrationNo: { type: String },
  rohiniNo: { type: String },
  coordinates: {
    lat: { type: Number },
    lng: { type: Number },
  },
  type: {
    type: String,
    enum: ["Single Specialist", "Multi Specialist", "Super Specialist", "Clinic", "Diagnostic Lab", "Nursing Home"],
  },
  departments: [{ type: String }],
  specialties:  [{ type: String }],
  spocEmail:    { type: String },
  photos: [{ type: String }],
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isVerified: { type: Boolean, default: false },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Hospital = mongoose.models.Hospital || mongoose.model("Hospital", hospitalSchema);
export default Hospital;