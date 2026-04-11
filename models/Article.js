import mongoose from "mongoose";

const blockSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ["h2", "paragraph", "bulletList", "image", "video"],
    required: true,
  },
  text:    { type: String, default: "" },
  items:   [{ type: String }],          // bulletList items
  url:     { type: String },            // image / video URL
  caption: { type: String, default: "" },
  size: {
    type: String,
    enum: ["small", "medium", "large", "full"],
    default: "full",
  },
}, { _id: false });

const articleSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    coverImage:  { type: String, default: "" },
    blocks:      [blockSchema],

    authorName:  { type: String, required: true },
    authorId:    { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    authorRole:  {
      type: String,
      enum: ["admin", "doctor", "staff"],
      default: "admin",
    },
    source:      { type: String, default: "" },

    // Tags matching User.preExistingDiseases for targeted notifications
    diseaseTags: [{
      type: String,
      enum: ["HTN", "Diabetes", "CVD", "CKD", "Thyroid Disorder", "Pregnancy", "Joint Pain"],
    }],
    generalTags: [{ type: String }],   // free-form: diet, tips, exercise …

    isPublished: { type: Boolean, default: false },
    views:       { type: Number, default: 0 },
  },
  { timestamps: true }
);

const Article = mongoose.models.Article || mongoose.model("Article", articleSchema);
export default Article;
