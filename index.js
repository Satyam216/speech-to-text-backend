import app from "./src/app.js";
import dotenv from "dotenv";
import supabase from "./src/config/supabaseClient.js";

dotenv.config();

// Supabase connection test before starting server
const testSupabaseConnection = async () => {
  try {
    const { data, error } = await supabase.from("transcriptions").select("*").limit(1);
    if (error) {
      console.error("Supabase connection failed:", error.message);
    } else {
      console.log("Supabase connected successfully!");
    }
  } catch (err) {
    console.error("Error testing Supabase connection:", err.message);
  }
};

const PORT = process.env.PORT || 5000;
// Start Server
app.listen(PORT, async () => {
  const url = `http://localhost:${PORT}`;
  console.log("🚀 Server is running successfully!");
  console.log(`🌐 Open in your browser: ${url}`);
  await testSupabaseConnection();
});
