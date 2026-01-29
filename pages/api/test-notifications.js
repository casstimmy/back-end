/**
 * Test Notification System
 * GET /api/test-notifications - Test only order_received and out_of_stock
 */

import { mongooseConnect } from "@/lib/mongoose";
import Notification from "@/models/Notification";
import Order from "@/models/Order";
import { checkOutOfStockNotifications, ensurePendingOrderNotifications } from "@/lib/notifications";

export default async function handler(req, res) {
  if (req.method !== "GET" && req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  try {
    await mongooseConnect();

    // Testing notification system (silent mode)

    // Check what orders actually exist
    const allOrders = await Order.find().lean();

    const pendingOrders = await Order.find({ status: { $regex: /^pending$/i } }).lean();
    
    
    if (pendingOrders.length > 0) {
    }

    // Count current notifications
    const beforeOrderCount = await Notification.countDocuments({ type: "order_received" });
    const beforeOutOfStockCount = await Notification.countDocuments({ type: "out_of_stock" });


    // Test 1: Backfill any missing order notifications
    const backfillResult = await ensurePendingOrderNotifications();

    // Test 2: Check for out of stock products
    const outOfStockResult = await checkOutOfStockNotifications();

    // Count after
    const afterOrderCount = await Notification.countDocuments({ type: "order_received" });
    const afterOutOfStockCount = await Notification.countDocuments({ type: "out_of_stock" });


    // Get stats
    const totalNotifications = await Notification.countDocuments();
    const unreadCount = await Notification.countDocuments({ isRead: false });
    const recentNotifications = await Notification.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean();


    return res.status(200).json({
      success: true,
      message: "Notification tests completed",
      ordersDebug: {
        totalOrders: allOrders.length,
        pendingOrders: pendingOrders.length,
        pendingOrderIds: pendingOrders.map(o => ({ id: o._id, status: o.status, customer: o.shippingDetails?.name }))
      },
      stats: {
        total: totalNotifications,
        unread: unreadCount,
        orderReceived: afterOrderCount,
        outOfStock: afterOutOfStockCount,
        created: {
          orders: afterOrderCount - beforeOrderCount,
          outOfStock: afterOutOfStockCount - beforeOutOfStockCount,
        },
      },
      recentNotifications: recentNotifications.map(n => ({
        id: n._id,
        type: n.type,
        title: n.title,
        message: n.message,
        isRead: n.isRead,
        createdAt: n.createdAt,
      })),
    });
  } catch (error) {
    console.error("[Test Error]", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}

async function testCheckLowStock() {}
async function testCheckEndedPromotions() {}
async function testOrderNotification() {}
async function testUpdateNotification() {}
async function runAllTests() {}

module.exports = { handler };
