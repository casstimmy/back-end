import mongoose, { Schema, models } from "mongoose";

const StaffSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Staff name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
    },
    username: {
      type: String,
      unique: true,
      required: [true, "Username is required"],
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false, // Don't return password by default
    },
    role: {
      type: String,
      enum: ["staff", "manager"],
      default: "staff",
      index: true,
    },
    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound indexes for common queries
StaffSchema.index({ isActive: 1, role: 1 });
StaffSchema.index({ createdAt: -1 });

// Avoid model overwrite errors in dev
export const Staff = models.Staff || mongoose.model("Staff", StaffSchema);
