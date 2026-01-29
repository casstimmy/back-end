import mongoose from "mongoose";

const OrderSchema = new mongoose.Schema(
  {
    customer: { type: mongoose.Schema.Types.ObjectId, ref: "Customer", index: true },
    shippingDetails: {
      name: { type: String, index: true },
      email: { type: String, index: true },
      phone: String,
      address: String,
      city: String,
    },
    cartProducts: [
      {
        productId: { type: mongoose.Schema.Types.ObjectId, ref: "Product" },
        name: String,
        price: Number,
        quantity: Number,
      },
    ],
    subtotal: Number,
    shippingCost: Number,
    total: Number,
    status: { type: String, default: "Pending", index: true },
    paid: { type: Boolean, default: false, index: true },
    paymentReference: { type: String },
    paymentStatus: { type: String, default: "Pending" },
  },
  { timestamps: true }
);

// Compound indexes for common queries
OrderSchema.index({ status: 1, createdAt: -1 });
OrderSchema.index({ customer: 1, createdAt: -1 });
OrderSchema.index({ createdAt: -1 });

// Note: Notification creation is handled in the API routes (pages/api/orders/index.js)
// to avoid circular dependencies and ensure proper control over when notifications are created

export default mongoose.models.Order || mongoose.model("Order", OrderSchema);
