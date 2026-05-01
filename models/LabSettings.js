import mongoose from "mongoose";

// Per-hospital lab letterhead configuration.
// Set once → auto-applied to every lab report and invoice until changed.
const labSettingsSchema = new mongoose.Schema({
  hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true, unique: true },

  // Lab branding (overrides Hospital model for reports)
  labName:  { type: String, default: "" },   // e.g., "Brims Diagnostic Centre"
  logoUrl:  { type: String, default: "" },   // Cloudinary URL
  address:  { type: String, default: "" },   // Full address as one string for letterhead
  phone:    { type: String, default: "" },
  email:    { type: String, default: "" },
  website:  { type: String, default: "" },

  // Accreditation / Registration
  labRegNo: { type: String, default: "" },   // State lab registration
  nablNo:   { type: String, default: "" },   // NABL accreditation number

  // GST / Business
  gstNumber:  { type: String, default: "" }, // GSTIN (15-char)
  panNumber:  { type: String, default: "" },
  invoicePrefix: { type: String, default: "INV" },

  // Default tax rates for invoices
  cgstRate: { type: Number, default: 0 },    // e.g., 2.5 for 5% GST split
  sgstRate: { type: Number, default: 0 },

  // Pathologist / Doctor sign-off
  pathologistName: { type: String, default: "" },
  pathologistQual: { type: String, default: "" }, // e.g., "MD (Pathology)"
  pathologistSign: { type: String, default: "" }, // Cloudinary URL of signature image

  // Lab Technician
  technicianName: { type: String, default: "" },
  technicianQual: { type: String, default: "" },  // e.g., "DMLT, B.Sc"
  technicianSign: { type: String, default: "" },  // Cloudinary URL

  // Custom letterhead (full A4-width header image)
  useCustomLetterhead: { type: Boolean, default: false },
  letterheadUrl:       { type: String, default: "" },

  // Invoice footer text / terms
  invoiceFooter: { type: String, default: "" },
  termsText:     { type: String, default: "" },
}, { timestamps: true });

const LabSettings = mongoose.models.LabSettings || mongoose.model("LabSettings", labSettingsSchema);
export default LabSettings;
