import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import compileRoutes from "./routes/compile.route.js"; 
import interviewRoutes from "./routes/interview.route.js"; // <--- 1. Import this
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- SOCKET.IO CONFIGURATION ---
const io = new Server(httpServer, {
  cors: {
    origin: "*", 
    methods: ["GET", "POST"],
  },
});

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: "10mb" })); 

// --- ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/compile", compileRoutes); 
app.use("/api/interview", interviewRoutes); // <--- 2. Add this line

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  socket.on("join-room", (roomId) => {
    socket.join(roomId);
  });

  // Code Sync
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
  });

  // Output Sync
  socket.on("output-change", ({ roomId, output }) => {
    socket.to(roomId).emit("output-update", output);
  });

  // Question Sync (Admin adds -> Candidate sees)
  socket.on("question-change", ({ roomId, question }) => {
    // Broadcast the new question to everyone in the room (including sender)
    io.in(roomId).emit("question-update", question);
  });

  // --- End Meeting (Admin ends -> Candidate forced to leave) ---
  socket.on("end-meeting", (roomId) => {
    socket.to(roomId).emit("meeting-ended");
  });

  socket.on("disconnect", () => {
    console.log("User disconnected");
  });
});

const PORT = process.env.PORT || 3000;

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
  connectDB();
});