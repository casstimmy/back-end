// /models/StockMovement.js
import { Schema, model, models } from "mongoose";

const StockMovementSchema = new Schema(
  {
    transRef: { type: String, required: true, index: true },
    fromLocation: { type: String, required: true, index: true },
    toLocation: { type: String, required: true, index: true },
    staff: { type: String, required: true },
    reason: { type: String, required: true, index: true },
    status: { type: String, default: "Received", index: true },
    totalCostPrice: { type: Number, default: 0 },
    barcode: { type: String, index: true },
    dateSent: { type: Date, default: Date.now },
    dateReceived: { type: Date },
    products: [
      {
        id: { type: Schema.Types.ObjectId, ref: "Product" },
        quantity: Number,
      },
    ],
  },
  { timestamps: true }
);

// Compound indexes for common queries
StockMovementSchema.index({ createdAt: -1 });
StockMovementSchema.index({ status: 1, createdAt: -1 });
StockMovementSchema.index({ fromLocation: 1, toLocation: 1 });

export const StockMovement =
  models.StockMovement || model("StockMovement", StockMovementSchema);
