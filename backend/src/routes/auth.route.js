import express from "express";
import { signup, login } from "../controllers/auth.controller.js";

const router = express.Router();

// This matches POST requests to /api/auth/signup
router.post("/signup", signup);

// This matches POST requests to /api/auth/login
router.post("/login", login);

export default router;