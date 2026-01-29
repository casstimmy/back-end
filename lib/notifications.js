import Notification from "@/models/Notification";
import Order from "@/models/Order";
import { Product } from "@/models/Product";
import { mongooseConnect } from "@/lib/mongoose";
import { invalidateCache } from "@/lib/cache";

/**
 * Format currency with comma separators
 */
function formatCurrency(amount) {
  if (amount === null || amount === undefined) return "₦0";
  return `₦${new Intl.NumberFormat("en-NG").format(amount)}`;
}

/**
 * Format number with comma separators
 */
function formatNumber(num) {
  if (num === null || num === undefined) return "0";
  return new Intl.NumberFormat("en-NG").format(num);
}

/**
 * BASE: Create a notification in database
 * @param {Object} data - Notification data
 * @returns {Promise<Object>} Created notification or null on error
 */
async function createNotification({
  type,
  title,
  message,
  referenceId,
  referenceType,
  data = {},
  priority = "medium",
  action = null,
}) {
  try {
    await mongooseConnect();

    const notification = await Notification.create({
      type,
      title,
      message,
      referenceId,
      referenceType,
      data,
      priority,
      action,
    });

    // Invalidate cache immediately so next API call gets fresh data
    invalidateCache("notifications");

    return notification;
  } catch (error) {
    console.error(`[✗ Notification Error] Type: ${type}, Error: ${error.message}`);
    return null;
  }
}

/**
 * TYPE 1: ORDER RECEIVED
 * Called when new order is placed with "Pending" status
 * Triggers immediately in POST /api/orders
 */
export async function createOrderNotification(order) {
  try {
    if (!order._id) {
      console.error("[✗ ORDER NOTIFICATION] No order ID");
      return null;
    }

    // Check for Pending or Processing orders
    const statusStr = String(order.status || "").toLowerCase();
    const isValidStatus = statusStr === "pending" || statusStr === "processing";
    
    if (!isValidStatus) {
      return null;
    }

    // PREVENT DUPLICATES: Check if already exists
    const exists = await Notification.findOne({
      referenceId: order._id.toString(),
      type: "order_received",
    });
    if (exists) {
      return exists;
    }

    // BUILD MESSAGE with product list
    const productsList = (order.cartProducts || [])
      .map((p) => `${p.name} (x${formatNumber(p.quantity)})`)
      .join(", ");

    const notification = await createNotification({
      type: "order_received",
      title: "🎁 New Order Received",
      message: `Order from ${order.shippingDetails?.name || order.customer?.name || "Customer"} - Items: ${productsList}. Total: ${formatCurrency(order.total)}`,
      referenceId: order._id.toString(),
      referenceType: "order",
      data: {
        orderId: order._id,
        customerName: order.shippingDetails?.name || order.customer?.name,
        customerEmail: order.shippingDetails?.email || order.customer?.email,
        customerPhone: order.shippingDetails?.phone || order.customer?.phone,
        totalAmount: order.total,
        itemCount: order.cartProducts?.length || 0,
        status: order.status,
      },
      priority: "high",
      action: {
        label: "View Order",
        link: `/manage/orders?search=${order._id}`,
      },
    });

    if (!notification) {
      console.error(`[✗ ORDER NOTIFICATION] Failed to create for order ${order._id}`);
      return null;
    }
    return notification;
  } catch (error) {
    console.error(`[✗ ORDER NOTIFICATION ERROR] ${error.message}`);
    return null;
  }
}

/**
 * TYPE 2: OUT OF STOCK
 * Called when product quantity reaches 0
 * Run manually via test endpoint or scheduled job
 */
export async function checkOutOfStockNotifications() {
  try {
    
    await mongooseConnect();

    // Find all products with 0 or less quantity
    const outOfStockProducts = await Product.find({
      quantity: { $lte: 0 },
    }).lean();

    // No verbose logs in production

    let created = 0;
    for (const product of outOfStockProducts) {
      // PREVENT DUPLICATES: Check if notification already exists (any time, not just today)
      const existingNotif = await Notification.findOne({
        referenceId: product._id.toString(),
        type: "out_of_stock",
        isRead: false, // Only check unread notifications
      });

      if (!existingNotif) {
        const notif = await createNotification({
          type: "out_of_stock",
          title: "⚠️ Out of Stock Alert",
          message: `Product "${product.name}" is OUT OF STOCK! Current stock: ${product.quantity}. Restock immediately.`,
          referenceId: product._id.toString(),
          referenceType: "product",
          data: {
            productId: product._id,
            productName: product.name,
            currentStock: 0,
            minStock: product.minStock,
          },
          priority: "high",
          action: {
            label: "Restock Now",
            link: `/stock/add?product=${product._id}`,
          },
        });
        if (notif) created++;
      } else {
        // Notification already exists; skip
      }
    }
    return { checked: outOfStockProducts.length, created };
  } catch (error) {
    console.error(`[✗ OUT OF STOCK CHECK ERROR] ${error.message}`);
    return { checked: 0, created: 0 };
  }
}

/**
 * REMOVE: Delete order notification when order leaves "Pending"
 * Called when order status changes to anything other than "Pending"
 */
export async function removeOrderNotifications(orderId) {
  try {
    await mongooseConnect();

    const ref = orderId?.toString?.() || String(orderId);

    // Delete them
    const result = await Notification.deleteMany({
      referenceId: ref,
      type: "order_received",
    });

    // Invalidate cache immediately
    invalidateCache("notifications");
    return result;
  } catch (err) {
    console.error(`[✗ REMOVE ORDER NOTIFICATION ERROR] ${err.message}`);
    console.error(err);
    return null;
  }
}

/**
 * BACKFILL: Create missing order notifications for recent pending orders
 * This runs periodically to catch any orders that didn't get notifications
 * Non-blocking - don't let errors stop the API response
 */
export async function ensurePendingOrderNotifications() {
  try {
    await mongooseConnect();

    const pendingOrders = await Order.find({ 
      status: { $regex: /^(pending|processing)$/i } 
    })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean();

    // Silence verbose debug logs

    let created = 0;
    for (const order of pendingOrders) {
      const exists = await Notification.findOne({
        referenceId: order._id.toString(),
        type: "order_received",
      });
      if (!exists) {
        const notif = await createOrderNotification(order);
        if (notif) created++;
      } else {
        // Already has a notification
      }
    }
    return { checked: pendingOrders.length, created };
  } catch (err) {
    console.error(`[✗ BACKFILL ERROR] ${err.message}`);
    return { checked: 0, created: 0 };
  }
}

/**
 * REMOVED FUNCTIONS (No longer needed):
 * - checkLowStockNotifications()
 * - checkEndedPromotions()
 * - backfillAllPendingOrderNotifications()
 *
 * These added complexity without clear business need
 */
