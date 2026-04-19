import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  day: { type: String },
  times: [{ type: String }],
});

const degreeSchema = new mongoose.Schema({
  degree: { type: String, required: true },        // MBBS, MD, MCH, DNB, etc.
  university: { type: String, required: true },    // Delhi University, AIIMS, etc.
  year: { type: Number },
});

const doctorSchema = new mongoose.Schema({
  doctorId: { type: String, unique: true, sparse: true },  // BRIMS-DR-XXXX
  name: { type: String, required: true },
  // Auth link — a doctor User account is linked here
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  mobile: { type: String },
  email:  { type: String },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  hospitalName: { type: String },
  department: { type: String, required: true },
  speciality: { type: String },
  
  // Enhanced Profile Fields
  registrationNumber: { type: String, unique: true, sparse: true },  // Medical Council Reg
  degrees: [degreeSchema],                                            // MBBS, MD, MCH, DNB, etc.
  collegeUG: { type: String },                                        // Undergraduate college
  collegePG: { type: String },                                        // Postgraduate college
  collegeMCH: { type: String },                                       // MCH college (if applicable)
  about: { type: String },                                            // Biography/about doctor
  profileComplete: { type: Boolean, default: false },                 // Track profile setup completion
  
  experience: { type: Number },
  photo: { type: String },
  opdFee: { type: Number, required: true },
  offerFee: { type: Number },
  availableSlots: [slotSchema],
  address: {
    district: { type: String },
    city: { type: String },
    state: { type: String, default: "Bihar" },
  },
  rating: { type: Number, default: 0 },
  totalReviews: { type: Number, default: 0 },
  isAvailable: { type: Boolean, default: true },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

const Doctor = mongoose.models.Doctor || mongoose.model("Doctor", doctorSchema);
export default Doctor;