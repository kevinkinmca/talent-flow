import express from "express";
import dotenv from "dotenv";
import cors from "cors";

// Import our custom files
import { connectDB } from "./lib/db.js";
import authRoutes from "./routes/auth.route.js";

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
// CORS allows your Frontend (localhost:5173) to talk to this Backend
app.use(cors({
    origin: process.env.CLIENT_URL || "http://localhost:5173",
    credentials: true
}));
app.use(express.json()); // Allows server to accept JSON data

// Connect to Database
connectDB();

// Routes
app.use("/api/auth", authRoutes);

// Health Check (to see if server is alive)
app.get("/", (req, res) => {
    res.send("Server is ready");
});

app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});