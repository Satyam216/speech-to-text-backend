import supabase from "../config/supabaseClient.js";

export const uploadAudio = async (req, res) => {
  try {
    const file = req.file;

    if (!file) {
      return res.status(400).json({ error: "No audio file uploaded" });
    }

    console.log("📥 File received:", file.originalname, file.mimetype);

    const bucketName = "audio-files"; // ✅ Must match your Supabase Storage bucket name
    const filePath = `uploads/${Date.now()}-${file.originalname}`;

    // ✅ Upload directly from memory (no disk read)
    const { data, error } = await supabase.storage
      .from(bucketName)
      .upload(filePath, file.buffer, {
        cacheControl: "3600",
        upsert: false,
        contentType: file.mimetype,
      });

    if (error) {
      console.error("❌ Supabase upload error:", error.message);
      return res.status(500).json({ error: "Failed to upload to Supabase" });
    }

    console.log("✅ Uploaded to Supabase:", data);

    // ✅ Get public URL
    const { data: publicUrlData } = supabase.storage
      .from(bucketName)
      .getPublicUrl(filePath);

    const audioUrl = publicUrlData.publicUrl;

    // ✅ Insert record into 'transcriptions' table
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
      message: "✅ Audio uploaded directly to Supabase and saved successfully",
      audioUrl,
    });
  } catch (err) {
    console.error("🚨 Server error:", err.message);
    return res.status(500).json({ error: "Internal Server Error" });
  }
};
