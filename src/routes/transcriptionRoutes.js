import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { transcribeAudio } from "../controllers/transcriptionController.js";

const router = express.Router();
router.post("/transcribe", upload.single("audio"), transcribeAudio);
export default router;
