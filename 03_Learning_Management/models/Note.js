// models/Note.js
import mongoose from "mongoose";
const NoteSchema = new mongoose.Schema(
  {
    title:    { type: String, required: true },
    content:  { type: String, default: "" },
    category: { type: String, default: "General" },
    pinned:   { type: Boolean, default: false },
  },
  { timestamps: true }
);
export default mongoose.models.Note || mongoose.model("Note", NoteSchema);