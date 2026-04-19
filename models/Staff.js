import mongoose from "mongoose";

const staffSchema = new mongoose.Schema(
  {
    staffId: { type: String, unique: true, required: true },  // STAFF-XXXXX
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital", required: true },
    
    // Basic Info
    name: { type: String, required: true },
    mobile: { type: String, required: true },
    email: { type: String, unique: true, sparse: true },
    designation: { type: String },  // Receptionist, Nurse, Admin, etc.
    department: { type: String },   // Which department works in
    phone: { type: String },        // Alternative contact
    age: { type: Number },
    gender: { type: String, enum: ["male", "female", "other"] },
    photo: { type: String },        // Cloudinary URL
    
    // Granular Permissions
    permissions: {
      canViewBookings: { type: Boolean, default: false },
      canUpdateBookingStatus: { type: Boolean, default: false },
      canCollectPayment: { type: Boolean, default: false },
      canUploadReports: { type: Boolean, default: false },
      canViewReports: { type: Boolean, default: false },
      canAccessPatientData: { type: Boolean, default: false },
      canAccessHospitalData: { type: Boolean, default: false },
      canManageStaff: { type: Boolean, default: false },  // Admin only
    },
    
    // Audit
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },  // Admin who created
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const Staff = mongoose.models.Staff || mongoose.model("Staff", staffSchema);
export default Staff;
