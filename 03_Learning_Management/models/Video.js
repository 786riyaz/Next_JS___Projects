// models/Video.js
import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    domain:      { type: String,  default: "" },
    priority:    { type: Number,  default: 0 },
    topic:       { type: String,  required: true },
    videoName:   { type: String,  required: true },
    channelName: { type: String,  default: "" },
    youtubeLink: { type: String,  required: true },
    // FIX: explicit Boolean with setter to coerce any stored string → boolean
    series: {
      type: Boolean,
      default: false,
      set: (v) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return v.trim().toLowerCase() === "yes" || v.trim().toLowerCase() === "true";
        return Boolean(v);
      },
    },
    downloaded: {
      type: Boolean,
      default: false,
      set: (v) => {
        if (typeof v === "boolean") return v;
        if (typeof v === "string") return v.trim().toLowerCase() === "yes" || v.trim().toLowerCase() === "true";
        return Boolean(v);
      },
    },
  },
  { timestamps: true }
);

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);