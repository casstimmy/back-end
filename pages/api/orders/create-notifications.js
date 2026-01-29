/**
 * API endpoint to create notifications for pending orders
 * Call this to generate notifications for any orders that don't have them yet
 * 
 * Usage: GET /api/orders/create-notifications
 */

import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Notification from "@/models/Notification";
import { createOrderNotification } from "@/lib/notifications";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await mongooseConnect();

  try {
    // Find all pending orders
    const pendingOrders = await Order.find({ 
      status: { $regex: /^pending$/i }
    }).sort({ createdAt: -1 });

    // Found pending orders to evaluate for notifications

    let created = 0;
    let skipped = 0;

    // For each pending order, check if notification exists
    for (const order of pendingOrders) {
      const existingNotif = await Notification.findOne({
        referenceId: order._id.toString(),
        type: "order_received",
      });

      if (existingNotif) {
        skipped++;
      } else {
        await createOrderNotification(order);
        created++;
      }
    }

    res.status(200).json({
      success: true,
      totalOrders: pendingOrders.length,
      notificationsCreated: created,
      notificationsSkipped: skipped,
      message: `Created ${created} notifications for pending orders`,
    });
  } catch (error) {
    console.error("Error creating notifications:", error);
    res.status(500).json({ 
      success: false,
      error: "Internal Server Error",
      details: error.message 
    });
  }
}
