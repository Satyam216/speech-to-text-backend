import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import supabase from "../config/supabaseClient.js";

const router = express.Router();

// 🔹 SIGNUP
router.post("/signup", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    // Check existing
    const { data: existing } = await supabase
      .from("users")
      .select("*")
      .eq("email", email);

    if (existing.length > 0)
      return res.status(400).json({ error: "Email already registered" });

    // Hash password
    const hashed = await bcrypt.hash(password, 10);

    // Insert user
    const { error } = await supabase.from("users").insert([{ email, password: hashed }]);
    if (error) throw error;

    res.status(201).json({ message: "Signup successful" });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

// 🔹 LOGIN
router.post("/login", async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password)
      return res.status(400).json({ error: "Email and password required" });

    const { data, error } = await supabase.from("users").select("*").eq("email", email);
    if (error || data.length === 0)
      return res.status(400).json({ error: "Invalid credentials" });

    const user = data[0];
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) return res.status(400).json({ error: "Invalid credentials" });

    const token = jwt.sign({ id: user.id, email: user.email }, "secretkey", {
      expiresIn: "1d",
    });

    res.json({ message: "Login successful", token });
  } catch (err) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
