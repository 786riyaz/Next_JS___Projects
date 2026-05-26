import mongoose from "mongoose";
const TaskSchema = new mongoose.Schema(
  {
    title:       { type: String, required: true },
    description: { type: String, default: "" },
    category:    { type: String, default: "General" },
    priority:    { type: String, enum: ["Low", "Medium", "High", "Critical"], default: "Medium" },
    status:      { type: String, enum: ["Todo", "In Progress", "Done"], default: "Todo" },
    estimatedDate: { type: Date, default: null },
  },
  { timestamps: true }
);
export default mongoose.models.Task || mongoose.model("Task", TaskSchema);