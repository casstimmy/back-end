// models/Product.js
import { model, Schema, models } from "mongoose";

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, index: true },
    description: { type: String, required: true },
    costPrice: { type: Number, required: true, min: 0 },
    taxRate: { type: Number, default: 0, min: 0, max: 100 },
    salePriceIncTax: { type: Number, required: true, min: 0 },
    margin: { type: Number, default: 0 },
    barcode: { type: String, index: true, sparse: true },
    category: { type: String, default: "Top Level", index: true },

    // Images now store full and thumb URLs
    images: [
      {
        full: { type: String, required: true },
        thumb: { type: String, required: true },
      },
    ],

    properties: [{ type: Object }],
    quantity: { type: Number, default: 0, min: 0 },
    minStock: { type: Number, default: 0, min: 0 },
    maxStock: { type: Number, default: 0, min: 0 },

   
    isPromotion: { type: Boolean, default: false, index: true },
    promoPrice: { type: Number, min: 0 }, 
    promoType: { type: String, default: null },
    promoStart: { type: Date },
    promoEnd: { type: Date, index: true },

    
    totalUnitsSold: { type: Number, default: 0, min: 0 },      
    totalRevenue: { type: Number, default: 0, min: 0 },         
    lastSoldAt: { type: Date },                         
    salesHistory: [
      {
        orderId: { type: Schema.Types.ObjectId, ref: "Order" },
        quantity: { type: Number, required: true, min: 1 },
        salePrice: { type: Number, required: true, min: 0 },    
        soldAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for common queries
ProductSchema.index({ name: "text", description: "text" });
ProductSchema.index({ isPromotion: 1, promoEnd: 1 });
ProductSchema.index({ quantity: 1, minStock: 1 }); // For low stock queries
ProductSchema.index({ category: 1, createdAt: -1 });

export const Product = models.Product || model("Product", ProductSchema);
