import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

/* ----------------------------- 🧩 SIGNUP ----------------------------- */
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
    console.error("❌ Signup error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

/* ----------------------------- 🔐 LOGIN ----------------------------- */
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
      message: "Login successful ✅",
      token,
      user: { id: user.id, email: user.email },
    });
  } catch (err) {
    console.error("❌ Login error:", err.message);
    return res.status(500).json({ error: "Server error. Please try again later." });
  }
});

export default router;
