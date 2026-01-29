// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  email: { 
    type: String, 
    unique: true, 
    required: true,
    lowercase: true,
    trim: true,
    index: true,
  },
  pinHash: { type: String, required: true },
  isAdmin: { type: Boolean, default: false, index: true },
}, { timestamps: true });

// Compound index for login queries
UserSchema.index({ username: 1, email: 1 });

export default mongoose.models.User || mongoose.model("User", UserSchema);
