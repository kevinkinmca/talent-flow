import mongoose from "mongoose";

const interviewSchema = new mongoose.Schema({
  roomId: { type: String, required: true },
  candidateId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  interviewerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  candidateName: { type: String, default: "Unknown" }, // Helps Admin see who they interviewed
  startTime: { type: Date, default: Date.now },
  endTime: Date,
  status: { type: String, enum: ["Live", "Completed"], default: "Live" },
  verdict: { type: String, enum: ["Pass", "Fail", "Pending"], default: "Pending" },
});

export const Interview = mongoose.model("Interview", interviewSchema);