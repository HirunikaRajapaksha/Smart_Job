import express from "express";
import bcrypt from "bcryptjs";
import getUserModel from "../models/User.js";
import { isSeekersDBReady } from "../db.js";

const router = express.Router();

// ── GET /api/users ─────────────────────────────────────────────────────────
// Get all users (passwords omitted) — Job_Seekers database
router.get("/", async (req, res) => {
  try {
    if (!isSeekersDBReady()) {
      return res.status(503).json({ message: "Job_Seekers database not connected yet." });
    }
    const User  = getUserModel();
    const users = await User.find().select("-password").sort({ createdAt: -1 });
    res.status(200).json(users);
  } catch (error) {
    res.status(500).json({ message: "Failed to fetch users" });
  }
});

// ── POST /api/users/register ───────────────────────────────────────────────
// Register a new user → saved to "Job_Seekers" database
router.post("/register", async (req, res) => {
  try {
    if (!isSeekersDBReady()) {
      return res.status(503).json({ message: "Job_Seekers database not connected. Please try again shortly." });
    }

    let { name, address, nic, email, telephone, password } = req.body;

    if (!name || !telephone || !password) {
      return res.status(400).json({ message: "Name, phone number and password are required" });
    }
    if (!email && !nic) {
      return res.status(400).json({ message: "Email or NIC is required" });
    }
    if (!nic) {
      nic = "USR-" + Date.now().toString().slice(-8);
    }
    if (password.length < 8) {
      return res.status(400).json({ message: "Password must contain at least 8 characters" });
    }

    const User  = getUserModel();
    const query = [{ nic }];
    if (email) query.push({ email: email.trim().toLowerCase() });

    const existingUser = await User.findOne({ $or: query });
    if (existingUser) {
      return res.status(409).json({
        message: existingUser.email === (email && email.trim().toLowerCase())
          ? "This Email is already registered"
          : "This NIC is already registered"
      });
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const user = await User.create({
      name:      name.trim(),
      address:   (address && address.trim()) || "Sri Lanka",
      nic:       nic.trim(),
      email:     (email   && email.trim().toLowerCase()) || "",
      telephone: telephone.trim(),
      password:  hashedPassword
    });

    console.log(`[Job_Seekers DB] ✅ New user registered: ${user.name} (${user.nic})`);

    res.status(201).json({
      message: "User registered successfully",
      user: { id: user._id, name: user.name, address: user.address, telephone: user.telephone, nic: user.nic, email: user.email }
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(409).json({ message: "This account is already registered" });
    }
    res.status(500).json({ message: "Registration failed: " + error.message });
  }
});

// ── POST /api/users/login ──────────────────────────────────────────────────
// Login → checks "Job_Seekers" database
router.post("/login", async (req, res) => {
  try {
    if (!isSeekersDBReady()) {
      return res.status(503).json({ message: "Job_Seekers database not connected. Please try again shortly." });
    }

    const identifier = (req.body.email || req.body.nic || "").trim();
    const { password } = req.body;

    if (!identifier || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const User = getUserModel();
    const user = await User.findOne({
      $or: [{ email: identifier.toLowerCase() }, { nic: identifier }]
    }).select("+password");

    if (!user) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid email or password" });
    }

    console.log(`[Job_Seekers DB] ✅ User logged in: ${user.name} (${user.nic})`);

    res.status(200).json({
      message: "Login successful",
      user: { id: user._id, name: user.name, address: user.address, telephone: user.telephone, nic: user.nic, email: user.email || identifier }
    });
  } catch (error) {
    res.status(500).json({ message: "Login failed" });
  }
});

export default router;