import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import { Transaction } from "@/models/Transactions";
import { createOrderNotification, checkOutOfStockNotifications } from "@/lib/notifications";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method Not Allowed" });
  }

  await mongooseConnect();

  const { orderId } = req.body;

  if (!orderId) {
    return res.status(400).json({ error: "Missing orderId" });
  }

  try {
    const order = await Order.findById(orderId).lean();

    if (!order) {
      return res.status(404).json({ error: "Order not found" });
    }

    // Proceed to create transaction and notifications for this order

    // Map cartProducts to match itemSchema format (Order model uses 'cartProducts')
    const items = (order.cartProducts || []).map((product) => ({
      productId: product.productId || null, // fallback if productId is missing
      name: product.name,
      price: product.price,
      qty: product.quantity,
    }));

    // Create transaction document
    const transaction = await Transaction.create({
      tenderType: "Online", // or "Paystack", "Card", etc.
      amountPaid: order.total,
      total: order.total,
      staff: "Online Store", // Assuming no staff for online orders
      location: "Online Store", // Assuming no specific location for online orders
      device: "WEB",
      tableName: "OrderCheckout",
      discount: 0,
      discountReason: "",
      customerName: order.customer?.name || "Online Customer",
      transactionType: "WEB",
      change: 0,
      items,
      createdAt: new Date(),
    });

    // Create notification for order received
    await createOrderNotification(order);

    // Check for out of stock products (async, don't block)
    checkOutOfStockNotifications().catch(err =>
      console.error("[from-order] Out of stock check error:", err.message)
    );

    return res.status(201).json({ message: "Transaction created", transaction });
  } catch (error) {
    console.error("Transaction creation failed:", error);
    return res.status(500).json({ error: "Internal Server Error" });
  }
}
