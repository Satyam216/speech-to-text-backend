import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

//signup
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    // Check if user already exists
    const { data: existing, error: findError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .limit(1);

    if (findError) throw findError;
    if (existing && existing.length > 0)
      return res.status(400).json({ error: "Email already registered." });

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert new user
    const { data: newUser, error: insertError } = await supabase
      .from("users")
      .insert([{ email, password: hashedPassword }])
      .select("id, email")
      .single();

    if (insertError) throw insertError;

    // Generate JWT Token
    const token = jwt.sign(
      { id: newUser.id, email: newUser.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.status(201).json({
      message: "Signup successful ✅",
      token,
      user: { id: newUser.id, email: newUser.email },
    });
  } catch (err) {
    console.error("Signup error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

//login part
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password)
      return res.status(400).json({ error: "Email and password are required." });

    // Find user
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, email, password")
      .eq("email", email)
      .limit(1);

    if (fetchError) throw fetchError;
    if (!users || users.length === 0)
      return res.status(400).json({ error: "Invalid credentials." });

    const user = users[0];

    // Validate password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid credentials." });

    // Generate JWT Token
    const token = jwt.sign(
      { id: user.id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    return res.json({
      message: "Login successful",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

router.post("/reset-password", async (req, res) => {
  try {
    const { email, mode, newPassword } = req.body;
    if (!email) return res.status(400).json({ error: "Email required" });

    // check user exists
    const { data: users, error: fetchError } = await supabase
      .from("users")
      .select("id, email")
      .eq("email", email)
      .limit(1);

    if (fetchError) throw fetchError;

    if (!users || users.length === 0) {
      // not found
      if (mode === "check") return res.status(200).json({ exists: false });
      return res.status(400).json({ error: "Email not registered" });
    }

    const user = users[0];

    if (mode === "check") {
      return res.status(200).json({ exists: true });
    }

    // mode === "reset" -> update password
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({ error: "New password must be at least 6 characters." });
    }

    const hashed = await bcrypt.hash(newPassword, 10);

    const { error: updateError } = await supabase
      .from("users")
      .update({ password: hashed })
      .eq("email", email);

    if (updateError) {
      console.error("Reset password update error:", updateError);
      return res.status(500).json({ error: "Unable to update password" });
    }

    return res.status(200).json({ updated: true });
  } catch (err) {
    console.error("Reset password error:", err);
    return res.status(500).json({ error: "Server error" });
  }
});

export default router;
