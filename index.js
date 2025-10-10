import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());

// Ensure uploads folder exists
const UPLOAD_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOAD_DIR)) fs.mkdirSync(UPLOAD_DIR);

// Multer storage config
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    // preserve original extension & add timestamp to avoid collisions
    const ext = path.extname(file.originalname);
    const name = path.basename(file.originalname, ext).replace(/\s+/g, "-");
    cb(null, `${name}-${Date.now()}${ext}`);
  },
});

// Accept only audio mime-types
const audioMimeTypes = [
  "audio/wav",
  "audio/x-wav",
  "audio/mpeg",
  "audio/mp3",
  "audio/ogg",
  "audio/webm",
  "audio/x-m4a",
  "audio/mp4",
];

function fileFilter(req, file, cb) {
  if (audioMimeTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new multer.MulterError("LIMIT_UNEXPECTED_FILE", "Only audio files are allowed"));
  }
}

// File size limit (example: 25 MB)
const limits = { fileSize: 25 * 1024 * 1024 };

const upload = multer({ storage, fileFilter, limits });

// Serve uploaded files statically (optional)
app.use("/uploads", express.static(UPLOAD_DIR));

// Upload route
// Field name for file = "audio" (frontend must use same field name)
app.post("/upload", upload.single("audio"), (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded" });

    // File info
    const { filename, originalname, size, path: filepath } = req.file;

    // Respond with basic info (you can extend to start transcription here)
    res.json({
      success: true,
      file: {
        filename,
        originalname,
        size,
        url: `/uploads/${filename}`,
      },
    });
  } catch (err) {
    console.error("Upload error:", err);
    res.status(500).json({ error: "Server error while uploading" });
  }
});

// multer error handler & fallback error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    // handle Multer errors
    return res.status(400).json({ error: err.message });
  }
  console.error(err);
  res.status(500).json({ error: "Internal server error" });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
