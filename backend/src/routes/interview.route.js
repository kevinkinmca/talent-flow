import express from "express";
import { Interview } from "../models/Interview.js";

const router = express.Router();

// 1. START OR JOIN Interview (Smarter Logic)
router.post("/start", async (req, res) => {
  const { roomId, candidateId, interviewerId, candidateName } = req.body;
  
  try {
    // Dynamically build the update object so we don't accidentally erase data
    const updateData = {};
    if (candidateId) updateData.candidateId = candidateId;
    if (interviewerId) updateData.interviewerId = interviewerId;
    if (candidateName) updateData.candidateName = candidateName;

    // "upsert: true" -> Create if missing, update if existing
    const interview = await Interview.findOneAndUpdate(
      { roomId }, 
      { $set: updateData }, 
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );

    res.status(200).json(interview);
  } catch (error) {
    console.error("Error starting interview:", error);
    res.status(500).json({ message: "Server Error" });
  }
});

// 2. END Interview (Update status when Admin leaves)
router.post("/end", async (req, res) => {
  const { roomId, verdict } = req.body;
  try {
    const interview = await Interview.findOneAndUpdate(
      { roomId },
      { 
        endTime: Date.now(), 
        status: "Completed",
        verdict: verdict || "Pending"
      },
      { new: true }
    );
    res.status(200).json(interview);
  } catch (error) {
    res.status(500).json({ message: "Error ending interview" });
  }
});

// 3. GET HISTORY (For Dashboard)
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Find interviews where user was EITHER candidate OR interviewer
    const interviews = await Interview.find({
      $or: [{ candidateId: userId }, { interviewerId: userId }]
    }).sort({ startTime: -1 }); // Newest first

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

export default router;