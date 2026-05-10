import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    priority: {
      type: Number,
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    videoName: {
      type: String,
      required: true,
    },

    channelName: {
      type: String,
      default: "",
    },

    youtubeLink: {
      type: String,
      required: true,
    },

    series: {
      type: String,
      default: "",
    },

    downloaded: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Video ||
  mongoose.model("Video", VideoSchema);