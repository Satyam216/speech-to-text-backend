import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import audioRoutes from "./routes/audioRoutes.js";
import authRoutes from "./routes/authRoutes.js";

dotenv.config();

const app = express();

//Middlewares
app.use(cors());
app.use(express.json());
app.use("/api/auth", authRoutes);
app.use("/uploads", express.static("uploads"));

//Health check route
app.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server is running successfully",
  });
});

//Audio routes
app.use("/api/audio", audioRoutes);

//404 fallback
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found",
  });
});

export default app;
