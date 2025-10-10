import { createClient } from "@deepgram/sdk";
import supabase from "../config/supabaseClient.js";

const deepgram = createClient(process.env.DEEPGRAM_API_KEY);

export const transcribeAudio = async (req, res) => {
  try {
    const { audioUrl } = req.body;
    if (!audioUrl) {
      return res.status(400).json({ error: "Missing audio URL" });
    }

    console.log("🎧 Transcribing from URL:", audioUrl);

    // Send audio URL to Deepgram for transcription
    const response = await deepgram.listen.prerecorded.transcribeUrl(audioUrl, {
      model: "nova-2",
      smart_format: true,
      detect_language: true,
    });

    const transcript =
      response?.result?.results?.channels?.[0]?.alternatives?.[0]?.transcript ||
      "No speech detected.";

    console.log("✅ Transcription success:", transcript);

    // ✅ Update transcription in Supabase
    const { error: updateError } = await supabase
      .from("transcriptions")
      .update({ transcription_text: transcript })
      .eq("audio_url", audioUrl);

    if (updateError) {
      console.error("❌ Supabase update error:", updateError.message);
    } else {
      console.log("🗃️ Supabase table updated successfully!");
    }

    res.status(200).json({
      success: true,
      transcription_text: transcript,
    });
  } catch (err) {
    console.error("❌ Deepgram transcription error:", err.message);
    res.status(500).json({ error: "Deepgram transcription failed" });
  }
};
