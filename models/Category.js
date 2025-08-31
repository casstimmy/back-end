import mongoose, { Schema, models, model } from "mongoose";

const CategorySchema = new Schema({
  name: { type: String, required: true },
  parent: { type: mongoose.Types.ObjectId, ref: "Category" },
  properties: [{ type: Object }],
  image: { type: String }, // optional
  slug: { type: String }, // optional for clean URLs
});

export const Category = models?.Category || model("Category", CategorySchema);
