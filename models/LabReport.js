import mongoose from "mongoose";

const resultSchema = new mongoose.Schema({
  paramId:      { type: String },
  name:         { type: String, required: true },
  value:        { type: String, default: "" },
  unit:         { type: String, default: "" },
  refRangeText: { type: String, default: "" },
  flag:         { type: String, enum: ["H", "L", "N", ""], default: "" },
  type:         { type: String, enum: ["numeric", "text"], default: "numeric" },
  section:      { type: String, default: "" },  // e.g. "HAEMATOLOGY", "RBC INDICES", "DLC"
}, { _id: false });

const labReportSchema = new mongoose.Schema({
  reportId:     { type: String, unique: true },
  hospitalId:   { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  hospitalName: { type: String },
  bookingId:    { type: mongoose.Schema.Types.ObjectId, ref: "Booking" },

  templateId:   { type: mongoose.Schema.Types.ObjectId, ref: "LabTemplate" },
  templateName: { type: String, required: true },
  category:     { type: String, default: "Blood Test" },

  // Sample details
  sampleType:   { type: String, default: "Blood" },    // Blood / Urine / Stool / Swab / Other
  referredBy:   { type: String, default: "" },          // Referring doctor name

  // Patient
  patientName:   { type: String, required: true },
  patientAge:    { type: Number },
  patientGender: { type: String, enum: ["male", "female", "other"], default: "male" },
  patientMobile: { type: String },
  patientRefId:  { type: String },

  // Results
  results: [resultSchema],

  // Sign-off
  technicianName: { type: String, default: "" },
  doctorName:     { type: String, default: "" },
  labName:        { type: String, default: "" },

  // Dates
  collectionDate: { type: Date, default: Date.now },
  reportDate:     { type: Date, default: Date.now },

  // Sample receiving workflow
  sampleStatus:     { type: String, enum: ["pending", "received", "rejected"], default: "pending" },
  sampleReceivedAt: { type: Date },
  sampleReceivedBy: { type: String, default: "" }, // staff name who received

  status:   { type: String, enum: ["draft", "final"], default: "draft" },
  isActive: { type: Boolean, default: true },
}, { timestamps: true });

labReportSchema.index({ hospitalId: 1, createdAt: -1 });
labReportSchema.index({ hospitalId: 1, status: 1 });

const LabReport = mongoose.models.LabReport || mongoose.model("LabReport", labReportSchema);
export default LabReport;
