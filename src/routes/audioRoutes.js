import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadAudio } from "../controllers/audioController.js";
import { verifyToken } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/upload", verifyToken, upload.single("audio"), uploadAudio);

export default router;
