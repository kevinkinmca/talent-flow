import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";
import compileRoutes from "./routes/compile.route.js"; 
import { createServer } from "http";
import { Server } from "socket.io";

dotenv.config();

const app = express();
const httpServer = createServer(app);

// --- 1. SOCKET.IO CONFIGURATION ---
const io = new Server(httpServer, {
  cors: {
    origin: "*", // Allows any IP (Home, College, Mobile) to connect to sockets
    methods: ["GET", "POST"],
  },
});

// --- 2. EXPRESS CORS CONFIGURATION ---
app.use(cors({
  origin: true, // Dynamically trusts the requester's IP
  credentials: true
}));

app.use(express.json({ limit: "10mb" })); 

// --- 3. ROUTES ---
app.use("/api/auth", authRoutes);
app.use("/api/compile", compileRoutes); 

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

  // 3. NEW: Output Sync -> Send the run result to everyone else
  socket.on("output-change", ({ roomId, output }) => {
    socket.to(roomId).emit("output-update", output);
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