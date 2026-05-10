import mongoose from "mongoose";

const PrioritySchema = new mongoose.Schema(
  {
    domain: {
      type: String,
      required: true,
    },

    topic: {
      type: String,
      required: true,
    },

    moduleOrder: {
      type: Number,
      required: true,
    },

    learnPriority: {
      type: Number,
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

export default mongoose.models.Priority ||
  mongoose.model("Priority", PrioritySchema);