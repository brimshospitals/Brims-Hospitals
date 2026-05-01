import mongoose from "mongoose";

const itemSchema = new mongoose.Schema({
  description: { type: String, required: true },
  hsnCode:     { type: String, default: "999312" }, // SAC for diagnostic services
  quantity:    { type: Number, default: 1 },
  rate:        { type: Number, required: true },
  discount:    { type: Number, default: 0 },        // discount amount (₹)
  taxableAmt:  { type: Number, default: 0 },
  cgstRate:    { type: Number, default: 0 },
  sgstRate:    { type: Number, default: 0 },
  cgstAmt:     { type: Number, default: 0 },
  sgstAmt:     { type: Number, default: 0 },
  amount:      { type: Number, required: true },    // final line amount incl. tax
}, { _id: false });

const invoiceSchema = new mongoose.Schema({
  invoiceId:      { type: String, unique: true },   // INV-00001
  hospitalId:     { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  hospitalName:   { type: String },

  // Patient / Buyer
  patientName:    { type: String, required: true },
  patientMobile:  { type: String, default: "" },
  patientAge:     { type: Number },
  patientGender:  { type: String, default: "" },
  patientAddress: { type: String, default: "" },

  // Linked references (optional)
  labReportId:  { type: String, default: "" },  // LabReport.reportId
  bookingId:    { type: String, default: "" },

  // Line items
  items: [itemSchema],

  // Totals
  subtotal:     { type: Number, default: 0 },  // sum of (qty×rate - discount)
  totalCgst:    { type: Number, default: 0 },
  totalSgst:    { type: Number, default: 0 },
  totalTax:     { type: Number, default: 0 },
  roundOff:     { type: Number, default: 0 },
  totalAmount:  { type: Number, default: 0 },  // grand total

  // Payment
  paymentMode:   { type: String, default: "Cash" },
  paidAmount:    { type: Number, default: 0 },
  balanceAmount: { type: Number, default: 0 },

  status:      { type: String, enum: ["draft", "partial", "paid", "cancelled"], default: "paid" },
  invoiceDate: { type: Date, default: Date.now },
  notes:       { type: String, default: "" },
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

invoiceSchema.index({ hospitalId: 1, createdAt: -1 });

const Invoice = mongoose.models.Invoice || mongoose.model("Invoice", invoiceSchema);
export default Invoice;
