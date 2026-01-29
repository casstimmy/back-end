import mongoose, { Schema, models } from "mongoose";

const NotificationSchema = new Schema(
  {
    // Notification type: 'promotion_end', 'order_received', 'low_stock', 'out_of_stock'
    type: {
      type: String,
      enum: ["promotion_end", "order_received", "low_stock", "out_of_stock"],
      required: true,
      index: true,
    },

    // Title/Subject of notification
    title: { type: String, required: true },

    // Detailed message
    message: { type: String, required: true },

    // Reference to related document (orderId, productId, etc)
    referenceId: { type: String, index: true },
    referenceType: { type: String, index: true }, // 'order', 'product', 'promotion'

    // Additional data (e.g., product name, order number, etc)
    data: { type: Object },

    // Status
    isRead: { type: Boolean, default: false, index: true },
    readAt: { type: Date },

    // Priority: 'low', 'medium', 'high'
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
      index: true,
    },

    // Action button (e.g., view order, check product)
    action: {
      label: String,
      link: String,
    },
  },
  { timestamps: true }
);

// Compound indexes for common queries
NotificationSchema.index({ isRead: 1, createdAt: -1 });
NotificationSchema.index({ type: 1, referenceId: 1 });
NotificationSchema.index({ createdAt: -1 });
NotificationSchema.index({ priority: 1, isRead: 1, createdAt: -1 });

const Notification = models.Notification || mongoose.model("Notification", NotificationSchema);

export default Notification;
