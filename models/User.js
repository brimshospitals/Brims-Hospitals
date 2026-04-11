import mongoose from "mongoose";

// Unique Member ID generator helper
function generateMemberId() {
  return "BRIMS-" + Date.now().toString(36).toUpperCase();
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
    enum: ["self", "spouse", "child", "parent", "sibling", "other"],
  },
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
      enum: ["user", "member", "doctor", "hospital", "staff", "admin"],
      default: "user",
    },

    // OTP Login
    otp: { type: String },
    otpExpiry: { type: Date },

    // Linked entity IDs
    doctorId:   { type: mongoose.Schema.Types.ObjectId, ref: "Doctor"   },
    hospitalId: { type: mongoose.Schema.Types.ObjectId, ref: "Hospital" },

    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const User = mongoose.models.User || mongoose.model("User", userSchema);

export default User;