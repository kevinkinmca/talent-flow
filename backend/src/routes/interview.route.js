import express from "express";
import { Interview } from "../models/Interview.js";
import { User } from "../models/User.js"; 

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

// 2. END Interview (FIXED: No longer erases previous data)
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

// 4. SCHEDULE INTERVIEW
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

// 5. GET UPCOMING INTERVIEWS
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

// 6. CANCEL/DELETE SCHEDULED INTERVIEW
router.delete("/cancel/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const deletedInterview = await Interview.findOneAndDelete({ roomId });
        
        if (!deletedInterview) {
            return res.status(404).json({ message: "Interview not found" });
        }
        
        res.status(200).json({ message: "Interview cancelled successfully" });
    } catch (error) {
        console.error("Error cancelling interview:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 7. RESCHEDULE INTERVIEW
router.put("/reschedule/:roomId", async (req, res) => {
    try {
        const { roomId } = req.params;
        const { scheduledDate } = req.body;

        // Find the interview by roomId and update only its scheduledDate
        const updatedInterview = await Interview.findOneAndUpdate(
            { roomId },
            { $set: { scheduledDate } },
            { new: true } // Returns the newly updated document
        );

        if (!updatedInterview) {
            return res.status(404).json({ message: "Interview not found" });
        }

        res.status(200).json(updatedInterview);
    } catch (error) {
        console.error("Error rescheduling:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 8. SAVE INDIVIDUAL ANSWER DURING INTERVIEW
router.post("/save-answer", async (req, res) => {
    try {
        const { roomId, question, code, output } = req.body;
        
        const updatedInterview = await Interview.findOneAndUpdate(
            { roomId },
            { 
                $push: { 
                    savedAnswers: { question, code, output } 
                } 
            },
            { new: true }
        );

        res.status(200).json(updatedInterview);
    } catch (error) {
        console.error("Error saving answer:", error);
        res.status(500).json({ message: "Server Error", error: error.message });
    }
});

// 9. --- FIXED: SAVE AI REVIEW (APPENDS INSTEAD OF OVERWRITING) ---
router.post("/save-ai-review", async (req, res) => {
    try {
        const { roomId, aiReview } = req.body;
        
        // Find the current interview document first
        const interview = await Interview.findOne({ roomId });
        
        // If there is already an AI review, add a line break and append the new one!
        let newReviewText = aiReview;
        if (interview && interview.aiReview && interview.aiReview.trim() !== "") {
            newReviewText = interview.aiReview + "\n\n-------------------\n\n" + aiReview;
        }

        // Save the combined reviews back to the database
        const updatedInterview = await Interview.findOneAndUpdate(
            { roomId },
            { aiReview: newReviewText },
            { new: true }
        );
        res.status(200).json(updatedInterview);
    } catch (error) {
        console.error("AI Review Save Error:", error);
        res.status(500).json({ message: "Server Error" });
    }
});

// 10. --- NEW: LOG PROCTORING INCIDENT ---
router.post("/log-proctoring", async (req, res) => {
    try {
        const { roomId, logMessage } = req.body;
        const updatedInterview = await Interview.findOneAndUpdate(
            { roomId },
            { $push: { proctoringLogs: logMessage } },
            { new: true }
        );
        res.status(200).json(updatedInterview);
    } catch (error) {
        res.status(500).json({ message: "Server Error" });
    }
});

export default router;