import mongoose from "mongoose";

const paramSchema = new mongoose.Schema({
  paramId:      { type: String, required: true },
  name:         { type: String, required: true },
  unit:         { type: String, default: "" },
  type:         { type: String, enum: ["numeric", "text"], default: "numeric" },
  refMaleMin:   { type: Number },
  refMaleMax:   { type: Number },
  refFemaleMin: { type: Number },
  refFemaleMax: { type: Number },
  refRangeText: { type: String, default: "" },
  notes:        { type: String, default: "" },
  order:        { type: Number, default: 0 },
  section:      { type: String, default: "" },       // e.g. "HAEMOGRAM", "RBC INDICES"
}, { _id: false });

const labTemplateSchema = new mongoose.Schema({
  hospitalId:  { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
  name:        { type: String, required: true },       // "Complete Blood Count (CBC)"
  category:    { type: String, default: "Blood Test" },
  department:  { type: String, default: "" },
  parameters:  [paramSchema],
  isActive:    { type: Boolean, default: true },
}, { timestamps: true });

const LabTemplate = mongoose.models.LabTemplate || mongoose.model("LabTemplate", labTemplateSchema);
export default LabTemplate;