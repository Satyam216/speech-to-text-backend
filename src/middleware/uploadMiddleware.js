import multer from "multer";

//Use memory storage (does NOT save file to local disk)
const storage = multer.memoryStorage();

//File type filter (only audio files)
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith("audio/")) {
    cb(null, true);
  } else {
    cb(new Error(" Only audio files are allowed"), false);
  }
};

//Initialize multer
const upload = multer({ storage, fileFilter });

export default upload;
