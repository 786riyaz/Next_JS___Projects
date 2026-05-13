// models/Link.js
import mongoose from "mongoose";
const LinkSchema = new mongoose.Schema(
  {
    category:  { type: String, required: true },
    topic:     { type: String, required: true },
    subtopic:  { type: String, default: "" },
    reference: { type: String, required: true },
  },
  { timestamps: true }
);
export default mongoose.models.Link || mongoose.model("Link", LinkSchema);