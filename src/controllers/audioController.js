import fs from "fs";
import path from "path";
import supabase from "../config/supabaseClient.js";

export const uploadAudio = async (req, res) => {
  try {
    const file = req.file;
    console.log("📥 File received:", file);

    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    // Read file from disk
    const fileBuffer = fs.readFileSync(file.path);

    // Upload to Supabase Storage (replace with your actual bucket name)
    const bucketName = "audio-files"; // ✅ Make sure this exists in Supabase Storage
    const filePath = `uploads/${file.filename}`;

    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, fileBuffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error.message);
      return res.status(500).json({ error: "Unable to upload the audio file" });
    }

    console.log("✅ Uploaded to Supabase:", data);

    // Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    // Save record in Supabase database
    const { error: insertError } = await supabase
      .from("transcriptions")
      .insert([
        {
          audio_url: audioUrl,
          transcription_text: "",
        },
      ]);

    if (insertError) {
      console.error("❌ Database insert error:", insertError.message);
      return res.status(500).json({ error: "Error saving to database" });
    }

    return res.status(200).json({
      success: true,
      message: "✅ Audio uploaded and saved successfully",
      audioUrl,
    });
  } catch (err) {
    console.error("🚨 Server error:", err);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
