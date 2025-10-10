import express from "express";
import upload from "../middleware/uploadMiddleware.js";
import { uploadAudio } from "../controllers/audioController.js";

const router = express.Router();

router.post("/upload", upload.single("audio"), uploadAudio);

export default router;
