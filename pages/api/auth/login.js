import bcrypt from "bcryptjs";
import { mongooseConnect } from "@/lib/mongoose";
import User from "@/models/User";
import { withSessionRoute } from "@/lib/session";

// Rate limiting: simple in-memory store (use Redis in production)
const loginAttempts = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_TIME = 15 * 60 * 1000; // 15 minutes

function checkRateLimit(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier);
  
  if (!attempts) return { allowed: true };
  
  // Clear old lockouts
  if (attempts.lockedUntil && now > attempts.lockedUntil) {
    loginAttempts.delete(identifier);
    return { allowed: true };
  }
  
  if (attempts.lockedUntil) {
    const remainingTime = Math.ceil((attempts.lockedUntil - now) / 1000 / 60);
    return { allowed: false, message: `Too many attempts. Try again in ${remainingTime} minutes.` };
  }
  
  return { allowed: true };
}

function recordFailedAttempt(identifier) {
  const now = Date.now();
  const attempts = loginAttempts.get(identifier) || { count: 0, firstAttempt: now };
  attempts.count++;
  
  if (attempts.count >= MAX_ATTEMPTS) {
    attempts.lockedUntil = now + LOCKOUT_TIME;
  }
  
  loginAttempts.set(identifier, attempts);
}

function clearAttempts(identifier) {
  loginAttempts.delete(identifier);
}

export default withSessionRoute(async function loginRoute(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { username, pin } = req.body;
    
    // Input validation
    if (!username || !pin) {
      return res.status(400).json({ error: "Username and PIN are required" });
    }
    
    if (typeof username !== "string" || typeof pin !== "string") {
      return res.status(400).json({ error: "Invalid input format" });
    }
    
    // Sanitize username (prevent NoSQL injection)
    const sanitizedUsername = username.trim().toLowerCase().replace(/[^a-z0-9_@.]/gi, "");
    
    // Check rate limiting
    const rateLimitCheck = checkRateLimit(sanitizedUsername);
    if (!rateLimitCheck.allowed) {
      return res.status(429).json({ error: rateLimitCheck.message });
    }
    
    await mongooseConnect();

    // Find user by username
    const user = await User.findOne({ username: sanitizedUsername });
    if (!user) {
      recordFailedAttempt(sanitizedUsername);
      return res.status(401).json({ error: "Invalid username or PIN" });
    }

    // Verify PIN
    const valid = await bcrypt.compare(pin, user.pinHash);
    if (!valid) {
      recordFailedAttempt(sanitizedUsername);
      return res.status(401).json({ error: "Invalid username or PIN" });
    }
    
    // Clear failed attempts on successful login
    clearAttempts(sanitizedUsername);

    // Create session
    req.session.user = {
      id: user._id.toString(),
      username: user.username,
      email: user.email,
      isAdmin: user.isAdmin,
      name: user.username,
    };
    await req.session.save();

    res.json({ ok: true, user: req.session.user });
  } catch (err) {
    console.error("[Login Error]:", err.message);
    res.status(500).json({ error: "Internal server error" });
  }
});
