// models/Product.js
import { model, Schema, models } from 'mongoose';

const ProductSchema = new Schema({
  name: { type: String, required: true },
  description: { type: String, required: true },
  costPrice: { type: Number, required: true },
  taxRate: { type: Number, default: 0 },
  salePriceIncTax: { type: Number, required: true },
  margin: { type: Number, default: 0 },
  barcode: { type: String },
  category: { type: String, default: "Top Level" },
  images: { type: [String], default: []},
  properties: [{ type: Object }],
  quantity: { type: Number, default: 0 },      
  minStock: { type: Number, default: 0 },      
  maxStock: { type: Number, default: 0 }, 
}, { timestamps: true });

export const Product = models.Product || model('Product', ProductSchema);
