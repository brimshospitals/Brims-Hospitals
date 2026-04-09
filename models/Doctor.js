import mongoose from "mongoose";

const slotSchema = new mongoose.Schema({
  day: { type: String },
  times: [{ type: String }],
});

const doctorSchema = new mongoose.Schema({
  name: { type: String, required: true },
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  hospitalName: { type: String },
  department: { type: String, required: true },
  speciality: { type: String },
  degrees: [{ type: String }],
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