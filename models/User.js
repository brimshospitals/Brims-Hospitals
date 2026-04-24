import mongoose from "mongoose";

// Unique Member ID generator helper — format: BRIMSYYMMXXXXX0
// YY=year, MM=month, XXXXX=5 random digits, last digit 0 for primary
function generateMemberId() {
  const now = new Date();
  const YY   = String(now.getFullYear()).slice(-2);
  const MM   = String(now.getMonth() + 1).padStart(2, "0");
  const rand = String(Math.floor(10000 + Math.random() * 90000));
  return `BRIMS${YY}${MM}${rand}0`;
}

// Health Record Schema (har member ka alag)
const healthRecordSchema = new mongoose.Schema({
  memberId: { type: String, default: generateMemberId },
  name: { type: String, required: true },
  age: { type: Number, required: true },
  gender: { type: String, enum: ["male", "female"], required: true },

  // Sirf female AND age 18+ ke liye
  maritalStatus: { type: String, enum: ["married", "unmarried"] },

  // Sirf married female ke liye
  isPregnant: { type: Boolean, default: false },
  lmp: { type: Date }, // Last Menstrual Period

  idType: {
    type: String,
    enum: ["Aadhaar", "PAN", "Voter ID", "Driving Licence", "Passport"],
  },
  idNumber: { type: String },
  photo: { type: String }, // Cloudinary URL

  preExistingDiseases: [
    {
      type: String,
      enum: [
        "HTN",
        "Diabetes",
        "CVD",
        "CKD",
        "Thyroid Disorder",
        "Pregnancy",
        "Joint Pain",
      ],
    },
  ],

  height: { type: Number }, // cm
  weight: { type: Number }, // kg
  relationship: {
    type: String,
    enum: ["self", "spouse", "child", "parent", "inlaw", "sibling", "other"],
  },
  // Optional separate mobile for secondary member
  alternateMobile: { type: String, default: null },
  isActive: { type: Boolean, default: true },
});

// Main User Schema
const userSchema = new mongoose.Schema(
  {
    // Primary login
    mobile: { type: String, required: true, unique: true },
    email: { type: String },

    // Primary member ki info
    name: { type: String, required: true },
    age: { type: Number, required: true },
    gender: { type: String, enum: ["male", "female"], required: true },
    maritalStatus: { type: String, enum: ["married", "unmarried"] },
    isPregnant: { type: Boolean, default: false },
    lmp: { type: Date },
    idType: {
      type: String,
      enum: ["Aadhaar", "PAN", "Voter ID", "Driving Licence", "Passport"],
    },
    idNumber: { type: String },
    photo: { type: String },

    // Address — Bihar focused
    address: {
      state: { type: String, default: "Bihar" },
      district: { type: String },
      prakhand: { type: String },
      village: { type: String },
    },

    preExistingDiseases: [
      {
        type: String,
        enum: [
          "HTN",
          "Diabetes",
          "CVD",
          "CKD",
          "Thyroid Disorder",
          "Pregnancy",
          "Joint Pain",
        ],
      },
    ],
    height: { type: Number },
    weight: { type: Number },

    // Family Members — max 5 secondary
    familyMembers: {
      type: [healthRecordSchema],
      validate: {
        validator: (arr) => arr.length <= 5,
        message: "Maximum 5 family members allowed",
      },
    },

    // Primary Member ka unique ID
    memberId: {
      type: String,
      unique: true,
      default: generateMemberId,
    },

    // Family Card & Wallet
    familyCardId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "FamilyCard",
    },
    walletBalance: { type: Number, default: 0 },

    // Referral
    referralCode: { type: String, unique: true, sparse: true },
    referredBy: { type: String },

    // Role
    role: {
      type: String,
      enum: ["user", "member", "doctor", "hospital", "staff", "admin", "coordinator"],
      default: "user",
    },

    // OTP Login
    otp: { type: String },
    otpExpiry: { type: Date },

    // Professional Account (Doctor/Hospital/Staff) — Password + ID
    professionalId: { type: String, unique: true, sparse: true },        // Email or Username
    professionalPassword: { type: String, sparse: true },                // bcrypt hashed
    professionalType: {
      type: String,
      enum: [null, "doctor", "hospital", "staff"],
      default: null,
    },

    // Password Login (deprecated — SHA256 hashed)
    password: { type: String },

    // Staff permissions — granular access control
    staffPermissions: {
      manageBookings:      { type: Boolean, default: true  }, // View + update booking status
      collectPayments:     { type: Boolean, default: true  }, // Accept counter payments
      managePatients:      { type: Boolean, default: false }, // View full patient profile
      uploadLabReports:    { type: Boolean, default: false }, // Upload lab reports
      cancelBookings:      { type: Boolean, default: false }, // Cancel bookings + issue refunds
      viewAnalytics:       { type: Boolean, default: false }, // View revenue & reports
      manageIPD:           { type: Boolean, default: false }, // IPD admission management
      dispatchAmbulance:   { type: Boolean, default: false }, // Ambulance dispatch
      manageHospitals:     { type: Boolean, default: false }, // Manage assigned hospitals (doctors/packages/labs)
      onboardHospitals:    { type: Boolean, default: false }, // Onboard new hospitals
      // Which hospitals this staff can manage (empty = none, used when manageHospitals=true)
      assignedHospitalIds: [{ type: mongoose.Schema.Types.ObjectId, ref: "Hospital" }],
    },

    // Linked entity IDs
    doctorId:      { type: mongoose.Schema.Types.ObjectId, ref: "Doctor"      },
    hospitalId:    { type: mongoose.Schema.Types.ObjectId, ref: "Hospital"    },
    staffId:       { type: mongoose.Schema.Types.ObjectId, ref: "Staff"       },
    coordinatorId: { type: mongoose.Schema.Types.ObjectId, ref: "Coordinator" },

    // FCM Push Notification token (web/mobile)
    fcmToken: { type: String, default: null },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;