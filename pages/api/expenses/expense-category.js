import { mongooseConnect } from "@/lib/mongoose";
import ExpenseCategory from "@/models/ExpenseCategory";
import mongoose from "mongoose";

const defaultCategories = [
  "Power/Utilities",
  "Logistics (Transportation)",
  "Repairs/Maintenance",
  "Petty Cash",
  "Supplies/Stock Purchase",
];

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[ExpenseCategory API] Database connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }

  // Seed default categories once if collection is empty
  try {
    const count = await ExpenseCategory.countDocuments();
    if (count === 0) {
      await ExpenseCategory.insertMany(
        defaultCategories.map(name => ({ name }))
      );
    }
  } catch (err) {
    console.error("[ExpenseCategory API] Seeding error:", err.message);
  }

  if (req.method === "GET") {
    try {
      const categories = await ExpenseCategory.find().sort({ name: 1 }).lean();

      // Put "Other" at the end
      const reordered = categories.filter(c => c.name !== "Other");
      const other = categories.find(c => c.name === "Other");
      if (other) reordered.push(other);

      return res.status(200).json(reordered);
    } catch (err) {
      console.error("[ExpenseCategory GET] Error:", err.message);
      return res.status(500).json({ error: "Failed to fetch categories" });
    }
  }

  if (req.method === "POST") {
    try {
      let { name } = req.body;

      if (!name || typeof name !== "string") {
        return res.status(400).json({ error: "Category name is required" });
      }

      name = name.trim();
      if (name.length < 2) {
        return res.status(400).json({ error: "Category name must be at least 2 characters" });
      }

      if (name.length > 50) {
        return res.status(400).json({ error: "Category name must be less than 50 characters" });
      }

      // Check for existing category (case-insensitive)
      const exists = await ExpenseCategory.findOne({ 
        name: { $regex: new RegExp(`^${name}$`, 'i') } 
      });
      
      if (exists) {
        return res.status(400).json({ error: "Category already exists" });
      }

      await ExpenseCategory.create({ name });

      const categories = await ExpenseCategory.find().sort({ name: 1 }).lean();
      const reordered = categories.filter(c => c.name !== "Other");
      const other = categories.find(c => c.name === "Other");
      if (other) reordered.push(other);

      return res.status(201).json(reordered);
    } catch (err) {
      console.error("[ExpenseCategory POST] Error:", err.message);
      return res.status(500).json({ error: "Failed to create category" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const { id } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Valid category ID is required" });
      }

      const category = await ExpenseCategory.findById(id);
      if (!category) {
        return res.status(404).json({ error: "Category not found" });
      }

      // Prevent deleting default categories
      if (defaultCategories.includes(category.name)) {
        return res.status(400).json({ error: "Cannot delete default categories" });
      }

      await ExpenseCategory.findByIdAndDelete(id);
      return res.status(200).json({ message: "Category deleted successfully" });
    } catch (err) {
      console.error("[ExpenseCategory DELETE] Error:", err.message);
      return res.status(500).json({ error: "Failed to delete category" });
    }
  }

  res.setHeader("Allow", ["GET", "POST", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
