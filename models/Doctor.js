import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  day: { type: String },
  times: [{ type: String }],
});

const degreeSchema = new mongoose.Schema({
  degree:     { type: String, required: true },
  university: { type: String, default: "" },
  year:       { type: Number },
}, { _id: false });

const prevExpSchema = new mongoose.Schema({
  institution: { type: String, default: "" },
  role:        { type: String, default: "" },
  yearFrom:    { type: String, default: "" },
  yearTo:      { type: String, default: "" },
}, { _id: false });

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true, sparse: true },
  name:     { type: String, required: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mobile:   { type: String },
  email:    { type: String },

  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  hospitalName: { type: String },

  department: { type: String, required: true },
  speciality: { type: String },

  registrationNumber: { type: String, unique: true, sparse: true },
  degrees:    [degreeSchema],
  collegeUG:  { type: String, default: "" },
  collegePG:  { type: String, default: "" },
  collegeMCH: { type: String, default: "" },
  about:      { type: String, default: "" },
  profileComplete: { type: Boolean, default: false },

  // Previous work experience (AIIMS / PMCH / PGI etc.)
  previousExperience: [prevExpSchema],

  // Awards & Recognition
  awards: [{ type: String }],

  experience: { type: Number },
  photo:      { type: String },
  opdFee:     { type: Number, required: true },
  offerFee:   { type: Number },

  availableSlots: [slotSchema],

  // Online consultation
  onlineAvailable: { type: Boolean, default: false },
  onlineFee:       { type: Number },
  onlineSlots:     [slotSchema],

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

  rating:       { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isAvailable:  { type: Boolean, default: true },
  isActive:     { type: Boolean, default: true },
}, { timestamps: true });

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
export default Doctor;