/**
 * Debug endpoint to check notification status
 * GET /api/debug/notifications
 */

import { mongooseConnect } from "@/lib/mongoose";
import Notification from "@/models/Notification";
import Order from "@/models/Order";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await mongooseConnect();

  try {
    // Count all notifications
    const totalNotifs = await Notification.countDocuments();
    const unreadNotifs = await Notification.countDocuments({ isRead: false });
    const orderNotifs = await Notification.countDocuments({ type: "order_received" });
    
    // Get last 5 notifications
    const recentNotifs = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    // Get last 5 orders
    const recentOrders = await Order.find()
      .select("_id status total createdAt shippingDetails")
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    res.status(200).json({
      success: true,
      notifications: {
        total: totalNotifs,
        unread: unreadNotifs,
        orderNotifications: orderNotifs,
        recent: recentNotifs.map(n => ({
          _id: n._id,
          type: n.type,
          title: n.title,
          referenceId: n.referenceId,
          createdAt: n.createdAt,
        })),
      },
      orders: {
        recent: recentOrders.map(o => ({
          _id: o._id,
          status: o.status,
          total: o.total,
          customerName: o.shippingDetails?.name,
          createdAt: o.createdAt,
        })),
      },
    });
  } catch (error) {
    console.error("Error in debug endpoint:", error);
    res.status(500).json({ 
      success: false, 
      error: error.message 
    });
  }
}
