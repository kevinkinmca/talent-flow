import express from "express";
import { Interview } from "../models/Interview.js";
import { User } from "../models/User.js"; // <--- NEW: Import User model to find candidate by email

const router = express.Router();

// 1. START OR JOIN Interview
router.post("/start", async (req, res) => {
  const { roomId, candidateId, interviewerId, candidateName } = req.body;
  
  try {
    // Dynamically build the update object so we don't accidentally erase data
    const updateData = {};
    if (candidateId) updateData.candidateId = candidateId;
    if (interviewerId) updateData.interviewerId = interviewerId;
    if (candidateName) updateData.candidateName = candidateName;

    // --- NEW: If it was Scheduled, change it to Live when they join ---
    updateData.status = "Live"; 

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

// 3. GET HISTORY (For Dashboard - ONLY COMPLETED)
router.get("/history/:userId", async (req, res) => {
  try {
    const { userId } = req.params;
    // Find interviews where user was EITHER candidate OR interviewer AND it is completed
    const interviews = await Interview.find({
      $or: [{ candidateId: userId }, { interviewerId: userId }],
      status: "Completed" // <--- NEW: Filter out scheduled ones
    }).sort({ startTime: -1 }); // Newest first

    res.json(interviews);
  } catch (error) {
    res.status(500).json({ message: "Error fetching history" });
  }
});

// 4. --- NEW: SCHEDULE INTERVIEW ---
router.post("/schedule", async (req, res) => {
    const { email, scheduledDate, interviewerId } = req.body;
    try {
        // Find candidate by their email address
        const candidate = await User.findOne({ email });
        
        // If they don't have an account yet, return an error
        if (!candidate) {
            return res.status(404).json({ message: "Candidate not found! Please check the email." });
        }

        // Generate a random room ID for the future meeting
        const roomId = Math.random().toString(36).substring(2, 9);

        const newInterview = new Interview({
            roomId,
            candidateId: candidate._id,
            candidateName: candidate.name,
            interviewerId,
            scheduledDate,
            status: "Scheduled"
        });

        await newInterview.save();
        res.status(200).json(newInterview);
    } catch (error) {
        console.error("Error scheduling:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 5. --- NEW: GET UPCOMING INTERVIEWS ---
router.get("/upcoming/:userId", async (req, res) => {
    try {
        const { userId } = req.params;
        const upcoming = await Interview.find({
            $or: [{ candidateId: userId }, { interviewerId: userId }],
            status: "Scheduled"
        }).sort({ scheduledDate: 1 }); // Sort by soonest first
        
        res.json(upcoming);
    } catch (error) {
        res.status(500).json({ message: "Error fetching upcoming sessions" });
    }
});

export default router;