import bcrypt from "bcryptjs";
import mongoose from "mongoose";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "POST") return res.status(405).end();

  const { username, pin } = req.body;
  if (!username || !pin) return res.status(400).json({ error: "Missing fields" });

  await mongoose.connect(process.env.MONGODB_URI);

  const existing = await User.findOne({ username });
  if (existing) return res.status(400).json({ error: "User already exists" });

  const pinHash = await bcrypt.hash(pin, 10);
  const user = await User.create({
    username,
    pinHash,
    isAdmin: username === "admin", // optional rule
  });

  res.json({ ok: true, user: { username: user.username } });
}
