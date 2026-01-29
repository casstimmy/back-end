import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

// Validation constants
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const MIN_PASSWORD_LENGTH = 6;

export default async function handler(req, res) {
  await mongooseConnect();

  const { id } = req.query;
  
  // Validate ObjectId format
  if (!mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid staff ID format" });
  }

  if (req.method === "GET") {
    try {
      const staff = await Staff.findById(id).select("-password");
      if (!staff) {
        return res.status(404).json({ error: "Staff not found" });
      }
      return res.status(200).json(staff);
    } catch (err) {
      console.error("[Staff GET Error]:", err.message);
      return res.status(500).json({ error: "Failed to fetch staff" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { name, username, password, role, isActive } = req.body;
      
      // Validate required fields
      if (!name || !username) {
        return res.status(400).json({ error: "Name and username are required" });
      }
      
      // Validate name
      if (typeof name !== "string" || name.trim().length < 2) {
        return res.status(400).json({ error: "Name must be at least 2 characters" });
      }
      
      // Validate username format
      const sanitizedUsername = username.trim().toLowerCase();
      if (!USERNAME_REGEX.test(sanitizedUsername)) {
        return res.status(400).json({ 
          error: "Username must be 3-30 characters, containing only letters, numbers, and underscores" 
        });
      }
      
      // Validate role if provided
      if (role && !['staff', 'manager'].includes(role)) {
        return res.status(400).json({ error: "Invalid role. Must be 'staff' or 'manager'" });
      }

      // Check if the new username already exists (and isn't the current document)
      const existing = await Staff.findOne({ 
        username: sanitizedUsername,
        _id: { $ne: id }
      });
      
      if (existing) {
        return res.status(400).json({ error: "Username already taken" });
      }

      // Build update object
      const updateData = {
        name: name.trim(),
        username: sanitizedUsername,
        role: role || 'staff',
        isActive: typeof isActive === 'boolean' ? isActive : true,
      };
      
      // Hash password if provided
      if (password) {
        if (typeof password !== "string" || password.length < MIN_PASSWORD_LENGTH) {
          return res.status(400).json({ 
            error: `Password must be at least ${MIN_PASSWORD_LENGTH} characters` 
          });
        }
        updateData.password = await bcrypt.hash(password, 12);
      }

      const updated = await Staff.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      ).select("-password");

      if (!updated) {
        return res.status(404).json({ error: "Staff not found" });
      }

      res.status(200).json(updated);
    } catch (err) {
      console.error("[Staff Update Error]:", err.message);
      res.status(500).json({ error: "Failed to update staff" });
    }
  } else if (req.method === "DELETE") {
    try {
      const deleted = await Staff.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Staff not found" });
      }
      res.status(200).json({ message: "Staff deleted successfully" });
    } catch (err) {
      console.error("[Staff Delete Error]:", err.message);
      res.status(500).json({ error: "Failed to delete staff" });
    }
  } else {
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
