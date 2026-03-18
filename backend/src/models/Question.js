import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  interviewerId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: "User", 
    required: true 
  },
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    required: true 
  }
}, { timestamps: true });

export const Question = mongoose.model("Question", questionSchema);