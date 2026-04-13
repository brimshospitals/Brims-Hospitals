import mongoose from "mongoose";

const reviewSchema = new mongoose.Schema({
  bookingId:   { type: mongoose.Schema.Types.ObjectId, ref: "Booking", required: true, unique: true },
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
  doctorId:    { type: mongoose.Schema.Types.ObjectId, ref: "Doctor"  },
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
  // What is being reviewed
  targetType:  { type: String, enum: ["doctor", "hospital"], required: true },
  rating:      { type: Number, min: 1, max: 5, required: true },
  comment:     { type: String, maxlength: 500, default: "" },
  // Denormalized for display
  patientName: { type: String, default: "" },
  doctorName:  { type: String, default: "" },
  hospitalName:{ type: String, default: "" },
  bookingType: { type: String, default: "" },
}, { timestamps: true });

const Review = mongoose.models.Review || mongoose.model("Review", reviewSchema);
export default Review;
