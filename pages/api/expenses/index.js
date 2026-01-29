// pages/api/expenses/index.js

import { mongooseConnect } from "@/lib/mongoose";
import Expense from "@/models/Expense";
import ExpenseCategory from "@/models/ExpenseCategory";
import mongoose from "mongoose";

/**
 * Validate expense data
 */
const validateExpenseData = (data) => {
  const errors = [];
  
  if (!data.title || typeof data.title !== "string" || data.title.trim().length < 2) {
    errors.push("Title must be at least 2 characters");
  }
  
  const amount = parseFloat(data.amount);
  if (isNaN(amount) || amount <= 0) {
    errors.push("Amount must be a positive number");
  }
  
  if (!data.category) {
    errors.push("Category is required");
  } else if (!mongoose.Types.ObjectId.isValid(data.category)) {
    errors.push("Invalid category ID format");
  }
  
  return errors;
};

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[Expenses API] Database connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 50, startDate, endDate, category, location } = req.query;
      
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      
      // Build query filter
      const filter = {};
      
      if (startDate || endDate) {
        filter.date = {};
        if (startDate) filter.date.$gte = new Date(startDate);
        if (endDate) filter.date.$lte = new Date(endDate);
      }
      
      if (category && mongoose.Types.ObjectId.isValid(category)) {
        filter.category = category;
      }
      
      if (location) {
        filter.location = location;
      }
      
      const total = await Expense.countDocuments(filter);
      const expenses = await Expense.find(filter)
        .populate("category", "name")
        .sort({ date: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      return res.status(200).json({
        expenses,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
      });
    } catch (err) {
      console.error("[Expenses GET] Error:", err.message);
      return res.status(500).json({ error: "Failed to fetch expenses" });
    }
  }

  if (req.method === "POST") {
    const { title, amount, category, description, location, date } = req.body;

    // Validate input
    const validationErrors = validateExpenseData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Validation failed", 
        errors: validationErrors 
      });
    }

    // Verify category exists
    const categoryExists = await ExpenseCategory.findById(category);
    if (!categoryExists) {
      return res.status(400).json({ error: "Category not found" });
    }

    try {
      const newExpense = await Expense.create({
        title: title.trim(),
        amount: parseFloat(amount),
        category, 
        description: description?.trim() || "",
        location: location?.trim() || null,
        date: date ? new Date(date) : new Date(),
      });

      // Populate category for response
      const populatedExpense = await Expense.findById(newExpense._id)
        .populate("category", "name")
        .lean();

      return res.status(201).json(populatedExpense);
    } catch (err) {
      console.error("[Expenses POST] Error:", err.message);
      return res.status(500).json({ error: "Failed to save expense" });
    }
  }

  if (req.method === "PUT") {
    const { id, title, amount, category, description, location, date } = req.body;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid expense ID is required" });
    }

    // Validate input
    const validationErrors = validateExpenseData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Validation failed", 
        errors: validationErrors 
      });
    }

    try {
      const updatedExpense = await Expense.findByIdAndUpdate(
        id,
        {
          title: title.trim(),
          amount: parseFloat(amount),
          category,
          description: description?.trim() || "",
          location: location?.trim() || null,
          ...(date && { date: new Date(date) }),
        },
        { new: true, runValidators: true }
      ).populate("category", "name");

      if (!updatedExpense) {
        return res.status(404).json({ error: "Expense not found" });
      }

      return res.status(200).json(updatedExpense);
    } catch (err) {
      console.error("[Expenses PUT] Error:", err.message);
      return res.status(500).json({ error: "Failed to update expense" });
    }
  }

  if (req.method === "DELETE") {
    const { id } = req.query;

    if (!id || !mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "Valid expense ID is required" });
    }

    try {
      const deleted = await Expense.findByIdAndDelete(id);
      if (!deleted) {
        return res.status(404).json({ error: "Expense not found" });
      }
      return res.status(200).json({ message: "Expense deleted successfully" });
    } catch (err) {
      console.error("[Expenses DELETE] Error:", err.message);
      return res.status(500).json({ error: "Failed to delete expense" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
