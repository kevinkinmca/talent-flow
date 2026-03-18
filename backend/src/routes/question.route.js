import express from "express";
import { Question } from "../models/Question.js";

const router = express.Router();

// 1. ADD a new question to the bank
router.post("/add", async (req, res) => {
  try {
    const { interviewerId, title, description } = req.body;
    
    if (!title || !description) {
        return res.status(400).json({ message: "Title and description are required" });
    }

    const newQuestion = new Question({ interviewerId, title, description });
    await newQuestion.save();
    
    res.status(201).json(newQuestion);
  } catch (error) {
    console.error("Error adding question:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. GET all questions for a specific admin/interviewer
router.get("/:interviewerId", async (req, res) => {
  try {
    const questions = await Question.find({ interviewerId: req.params.interviewerId }).sort({ createdAt: -1 });
    res.status(200).json(questions);
  } catch (error) {
    console.error("Error fetching questions:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 3. DELETE a question
router.delete("/:id", async (req, res) => {
  try {
    const deletedQuestion = await Question.findByIdAndDelete(req.params.id);
    if (!deletedQuestion) {
        return res.status(404).json({ message: "Question not found" });
    }
    res.status(200).json({ message: "Question deleted successfully" });
  } catch (error) {
    console.error("Error deleting question:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

export default router;