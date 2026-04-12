import mongoose from "mongoose";

const reportSchema = new mongoose.Schema(
  {
    reportId: { type: String, unique: true },
    userId:       { type: mongoose.Schema.Types.ObjectId, ref: "User",    required: true },
    hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },
    bookingId:    { type: mongoose.Schema.Types.ObjectId, ref: "Booking"  },
    uploadedByRole: { type: String, enum: ["doctor", "hospital", "staff", "admin"], default: "hospital" },
    uploadedById: { type: mongoose.Schema.Types.ObjectId },
    title:        { type: String, required: true },
    category:     { type: String, enum: ["Lab", "Radiology", "OPD", "Surgery", "Prescription", "Other"], default: "Lab" },
    fileUrl:      { type: String, required: true },
    fileType:     { type: String, enum: ["pdf", "image"], default: "pdf" },
    notes:        { type: String },
    reportDate:   { type: Date, default: Date.now },
    hospitalName: { type: String },
    patientName:  { type: String },
  },
  { timestamps: true }
);

const Report = mongoose.models.Report || mongoose.model("Report", reportSchema);
export default Report;
