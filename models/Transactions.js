// models/Transactions.js

import mongoose from "mongoose";

const itemSchema = new mongoose.Schema(
  {
    productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
    name: String,
    salePriceIncTax: Number,
    qty: { type: Number, min: 0 },
  },
  { _id: false } // don't auto-generate _id for subdocs
);

const TransactionSchema = new mongoose.Schema({
  tenderType: { type: String, index: true },
  amountPaid: { type: Number, min: 0 },
  total: { type: Number, min: 0 },
  staff: { type: String, default: "Online User", index: true },
  location: { type: String, index: true },
  device: String,
  tableName: String,
  discount: { type: Number, default: 0, min: 0 },
  discountReason: String,
  customerName: String,
  transactionType: { type: String, index: true }, // POS or WEB
  change: { type: Number, default: 0, min: 0 },
  items: {
    type: [itemSchema],
    default: [],
  },
  createdAt: { type: Date, default: Date.now, index: true },
});

// Compound indexes for common queries
TransactionSchema.index({ createdAt: -1, location: 1 });
TransactionSchema.index({ staff: 1, createdAt: -1 });
TransactionSchema.index({ transactionType: 1, createdAt: -1 });
TransactionSchema.index({ tenderType: 1, createdAt: -1 });

const Transaction = mongoose.models.Transaction || mongoose.model("Transaction", TransactionSchema);

export { Transaction };
