import mongoose from "mongoose";

const familyMemberSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
  },
  name: String,
  age: Number,
  gender: String,
  relation: String,
  disease: String,
});

export default mongoose.models.FamilyMember ||
  mongoose.model("FamilyMember", familyMemberSchema);