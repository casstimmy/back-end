// models/User.js
import mongoose from "mongoose";

const UserSchema = new mongoose.Schema({
  username: { type: String, unique: true },
  pinHash: String,
  isAdmin: { type: Boolean, default: false },
});

export default mongoose.models.User || mongoose.model("User", UserSchema);
