import fs from "fs";
import path from "path";
import supabase from "../config/supabaseClient.js";
import { createClient } from "@deepgram/sdk";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export const uploadAudio = async (req, res) => {
  try {
    const file = req.file;
    const user = req.user; // user info from JWT middleware
    if (!file) return res.status(400).json({ error: "No audio file uploaded" });

    console.log("📥 File received:", file.originalname);

    // ✅ Save temp file locally (for Deepgram file transcription)
    const tempPath = path.join("temp", `${Date.now()}-${file.originalname}`);
    fs.mkdirSync("temp", { recursive: true });
    fs.writeFileSync(tempPath, file.buffer);

    // ✅ Upload to Supabase Storage
    const bucketName = "audio-files";
    const supabaseFilePath = `uploads/${Date.now()}-${file.originalname}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(supabaseFilePath, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error.message);
      fs.unlinkSync(tempPath);
      return res.status(500).json({ error: "Unable to upload the audio file" });
    }

    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(supabaseFilePath);

    const audioUrl = publicUrlData.publicUrl;

    console.log("🎧 Transcribing audio from buffer...");

    // ✅ Deepgram Transcription using local file buffer
    const audioBuffer = fs.readFileSync(tempPath);
    const dgResponse = await deepgram.listen.prerecorded.transcribeFile(audioBuffer, {
      model: "nova-2",
      smart_format: true,
      detect_language: true,
      diarize: false,  
      punctuate: true,
      filler_words: true,
      vad_turnoff: 2,
    });

    const transcript =
      dgResponse?.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      "No speech detected.";

    console.log("Transcription success:", transcript);

      const duration_seconds = dgResponse?.result?.metadata?.duration || null; // Deepgram se duration milta hai
      const file_size = file.size || fs.statSync(tempPath).size;
      const mime_type = file.mimetype;

      console.log("📊 Metadata:", { file_size, duration_seconds, mime_type });

    // ✅ Save to Supabase Database
    const { error: insertError } = await supabase.from("transcriptions").insert([
      {
        user_id: user?.id || null,
        user_email: user?.email || "Unknown",
        audio_url: audioUrl,
        transcription_text: transcript,
        file_size,
        duration_seconds,
        mime_type,
      },
    ]);

    if (insertError) console.error("❌ DB insert error:", insertError.message);
    else console.log("🗃️ Supabase table updated successfully!");

    // ✅ Delete temp file
    fs.unlinkSync(tempPath);

    return res.status(200).json({
      success: true,
      audioUrl,
      transcription_text: transcript,
      file_size,
      duration_seconds,
      mime_type,
    });
  } catch (err) {
    console.error("🚨 Server error:", err);
    res.status(500).json({ error: "Internal Server Error" });
  }
};
