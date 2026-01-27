import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// Configure Socket.io with LOCALHOST + NETWORK IP
const io = new Server(httpServer, {
  cors: {
    origin: [
      "http://localhost:5173",
      "http://localhost:5174",
      "http://192.168.5.35:5173", // <--- Your Network IP (Mobile/Laptop access)
      "http://192.168.5.35:5174"  // <--- Your Network IP (Backup port)
    ],
    methods: ["GET", "POST"],
  },
});

// Configure Express CORS with LOCALHOST + NETWORK IP
app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5174",
    "http://192.168.5.35:5173", // <--- Your Network IP
    "http://192.168.5.35:5174"  // <--- Your Network IP
  ],
  credentials: true
}));

app.use(express.json({ limit: "10mb" })); 

app.use("/api/auth", authRoutes);

// --- SOCKET.IO LOGIC ---
io.on("connection", (socket) => {
  console.log("A user connected:", socket.id);

  // 1. User joins a specific interview room
  socket.on("join-room", (roomId) => {
    socket.join(roomId);
    console.log(`User ${socket.id} joined room: ${roomId}`);
  });

  // 2. User types code -> Send to everyone else in that room
  socket.on("code-change", ({ roomId, code }) => {
    socket.to(roomId).emit("code-update", code);
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