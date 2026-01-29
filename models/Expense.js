import mongoose from "mongoose";

const ExpenseSchema = new mongoose.Schema({
  title: { type: String, required: true, trim: true },
  amount: { type: Number, required: true, min: 0 },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "ExpenseCategory",
    required: true,
    index: true,
  },
  location: {
    type: String,
    default: null,
    index: true,
  },
  date: { type: Date, default: Date.now, index: true },
  description: { type: String, trim: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', index: true }
}, { timestamps: true });

// Compound indexes for common queries
ExpenseSchema.index({ date: -1, category: 1 });
ExpenseSchema.index({ location: 1, date: -1 });
ExpenseSchema.index({ createdAt: -1 });

export default mongoose.models.Expense || mongoose.model("Expense", ExpenseSchema);
