import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Transaction } from "@/models/Transactions";
import { Product } from "@/models/Product";
import { createOrderNotification, removeOrderNotifications } from "@/lib/notifications";
import mongoose from "mongoose";

// Valid order statuses
const VALID_STATUSES = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[Order API] Database connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }

  const { id } = req.query;

  // Validate ObjectId format
  if (!id || !mongoose.Types.ObjectId.isValid(id)) {
    return res.status(400).json({ error: "Invalid order ID format" });
  }

  if (req.method === "GET") {
    try {
      const order = await Order.findById(id)
        .populate("customer", "name email phone")
        .lean();
        
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }
      
      return res.status(200).json(order);
    } catch (error) {
      console.error("[Order GET] Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch order" });
    }
  }

  if (req.method === "PUT") {
    try {
      const { status } = req.body;

      // Validate status
      if (!status || !VALID_STATUSES.includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status", 
          validStatuses: VALID_STATUSES 
        });
      }

      // Fetch the order
      const order = await Order.findById(id).lean();
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Prevent marking delivered twice
      if (order.status === "Delivered" && status === "Delivered") {
        return res.status(400).json({ error: "Order already marked as Delivered" });
      }

      // Prevent changing status of cancelled orders
      if (order.status === "Cancelled" && status !== "Cancelled") {
        return res.status(400).json({ error: "Cannot change status of cancelled order" });
      }

      // Update the status
      const updatedOrder = await Order.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true }
      );

      // REMOVE notification when order is "Delivered"
      const newStatus = String(status).toLowerCase();

      if (newStatus === "delivered") {
        try {
          const result = await removeOrderNotifications(id);
        } catch (err) {
          console.error(`[Order PUT] ❌ Remove notification error: ${err.message}`);
        }
      }

      // Only handle "Delivered" logic if status is changed to Delivered
      if (status === "Delivered" && order.status !== "Delivered") {
        const items = (order.cartProducts || []).map((item) => ({
          name: item.name,
          qty: item.quantity,
          salePriceIncTax: item.price,
          productId: item.productId,
        }));

        // Save transaction
        await Transaction.create({
          tenderType: "online",
          amountPaid: order.total,
          total: order.total,
          staff: "Online User",
          location: "Web",
          device: "Web",
          tableName: null,
          discount: 0,
          discountReason: null,
          customerName: order.shippingDetails?.name || "Online Customer",
          transactionType: "Web",
          change: 0,
          items,
        });

        // Reduce inventory using bulkWrite for better performance
        const bulkOps = items
          .filter(item => item.productId && item.qty > 0)
          .map(item => ({
            updateOne: {
              filter: { _id: item.productId },
              update: { 
                $inc: { 
                  quantity: -item.qty, 
                  totalUnitsSold: item.qty,
                  totalRevenue: item.salePriceIncTax * item.qty,
                },
                $set: { lastSoldAt: new Date() },
              },
            },
          }));

        if (bulkOps.length > 0) {
          await Product.bulkWrite(bulkOps);
        }
      }

      return res.status(200).json(updatedOrder);
    } catch (error) {
      console.error("[Order PUT] Error:", error.message);
      return res.status(500).json({ error: "Failed to update order" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      // Only allow deletion of pending/cancelled orders
      if (!["Pending", "Cancelled"].includes(order.status)) {
        return res.status(400).json({ 
          error: "Can only delete pending or cancelled orders" 
        });
      }

      await Order.findByIdAndDelete(id);
      
      // Remove any associated notifications
      removeOrderNotifications(id).catch(err => 
        console.error("[Order DELETE] Remove notification error:", err.message)
      );

      return res.status(200).json({ message: "Order deleted successfully" });
    } catch (error) {
      console.error("[Order DELETE] Error:", error.message);
      return res.status(500).json({ error: "Failed to delete order" });
    }
  }

  res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
