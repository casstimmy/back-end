// pages/api/auth/register.js
import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const MIN_PIN_LENGTH = 4;

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, email, pin } = req.body;
    
    // Validate required fields
    if (!username || !email || !pin) {
      return res.status(400).json({ error: "All fields are required" });
    }
    
    // Validate types
    if (typeof username !== "string" || typeof email !== "string" || typeof pin !== "string") {
      return res.status(400).json({ error: "Invalid input format" });
    }
    
    // Sanitize and validate username
    const sanitizedUsername = username.trim().toLowerCase();
    if (!USERNAME_REGEX.test(sanitizedUsername)) {
      return res.status(400).json({ 
        error: "Username must be 3-30 characters, containing only letters, numbers, and underscores" 
      });
    }
    
    // Validate email format
    const sanitizedEmail = email.trim().toLowerCase();
    if (!EMAIL_REGEX.test(sanitizedEmail)) {
      return res.status(400).json({ error: "Invalid email format" });
    }
    
    // Validate PIN strength
    if (pin.length < MIN_PIN_LENGTH) {
      return res.status(400).json({ error: `PIN must be at least ${MIN_PIN_LENGTH} characters` });
    }

    await mongooseConnect();

    // Check for existing user (case-insensitive)
    const existing = await User.findOne({ 
      $or: [
        { username: sanitizedUsername }, 
        { email: sanitizedEmail }
      ] 
    });
    
    if (existing) {
      return res.status(400).json({ error: "Username or email already exists" });
    }

    // Hash PIN with strong salt rounds
    const pinHash = await bcrypt.hash(pin, 12);

    // Create user (isAdmin is false by default - admin must be set manually in database)
    const user = await User.create({
      username: sanitizedUsername,
      email: sanitizedEmail,
      pinHash,
      isAdmin: false, // Never auto-assign admin privileges
    });

    return res.status(201).json({ 
      ok: true, 
      user: { 
        username: user.username, 
        email: user.email 
      } 
    });
  } catch (err) {
    console.error("[Registration Error]:", err.message);
    
    // Handle MongoDB duplicate key error
    if (err.code === 11000) {
      return res.status(400).json({ error: "Username or email already exists" });
    }
    
    return res.status(500).json({ error: "Registration failed. Please try again." });
  }
}
