import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Customer from "@/models/Customer";
import mongoose from "mongoose";
import { createOrderNotification, checkOutOfStockNotifications, removeOrderNotifications } from "@/lib/notifications";

/**
 * Sanitize regex input to prevent ReDoS attacks
 */
const sanitizeRegex = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

/**
 * Validate order data
 */
const validateOrderData = (data) => {
  const errors = [];
  
  if (!data.cartProducts || !Array.isArray(data.cartProducts) || data.cartProducts.length === 0) {
    errors.push("At least one product is required");
  }
  
  if (data.cartProducts) {
    for (const item of data.cartProducts) {
      if (!item.name) errors.push("Product name is required");
      if (!item.quantity || item.quantity < 1) errors.push("Product quantity must be at least 1");
      if (!item.price || item.price < 0) errors.push("Product price must be a positive number");
    }
  }
  
  if (!data.total || parseFloat(data.total) <= 0) {
    errors.push("Order total must be greater than 0");
  }
  
  if (data.shippingDetails) {
    if (!data.shippingDetails.name || data.shippingDetails.name.trim().length < 2) {
      errors.push("Customer name is required");
    }
  }
  
  return errors;
};

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[Orders API] Database connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method === "GET") {
    const { page = 1, limit = 10, search = "" } = req.query;
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 10));

    try {
      let query = {};

      if (search) {
        const sanitizedSearch = sanitizeRegex(search.trim());
        if (mongoose.Types.ObjectId.isValid(search)) {
          // Search directly by Order ID or customer ID
          query = { $or: [{ _id: search }, { customer: search }] };
        } else if (sanitizedSearch) {
          // Search by shipping details (actual customer info)
          query = {
            $or: [
              { "shippingDetails.name": { $regex: sanitizedSearch, $options: "i" } },
              { "shippingDetails.email": { $regex: sanitizedSearch, $options: "i" } },
              { "shippingDetails.phone": { $regex: sanitizedSearch, $options: "i" } },
            ],
          };
        }
      }

      const total = await Order.countDocuments(query);

      const orders = await Order.find(query)
        .populate("customer", "name email phone")
        .sort({ createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean();

      res.status(200).json({
        orders,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        total,
      });
    } catch (error) {
      console.error("[Orders GET] Error:", error.message);
      res.status(500).json({ error: "Failed to fetch orders" });
    }
  } 
  
  else if (req.method === "POST") {
    try {
      const { customer, shippingDetails, cartProducts, subtotal, shippingCost, total, status = "Pending" } = req.body;

      // Validate input
      const validationErrors = validateOrderData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          error: "Validation failed", 
          errors: validationErrors 
        });
      }

      // Validate customer ID if provided
      if (customer && !mongoose.Types.ObjectId.isValid(customer)) {
        return res.status(400).json({ error: "Invalid customer ID format" });
      }

      const order = new Order({
        customer: customer || null,
        shippingDetails: {
          name: shippingDetails?.name?.trim() || "Guest",
          email: shippingDetails?.email?.trim().toLowerCase() || "",
          phone: shippingDetails?.phone?.trim() || "",
          address: shippingDetails?.address?.trim() || "",
          city: shippingDetails?.city?.trim() || "",
        },
        cartProducts: cartProducts.map(item => ({
          productId: item.productId || null,
          name: item.name?.trim() || "Unknown Product",
          price: parseFloat(item.price) || 0,
          quantity: parseInt(item.quantity) || 1,
        })),
        subtotal: parseFloat(subtotal) || parseFloat(total) || 0,
        shippingCost: parseFloat(shippingCost) || 0,
        total: parseFloat(total) || 0,
        status,
        paid: false,
        paymentStatus: "Pending",
      });

      await order.save();

      // CREATE NOTIFICATION for new pending orders (synchronous, must complete before response)
      const isPending = String(order.status).toLowerCase() === "pending";
      
      if (isPending) {
        try {
          const notif = await createOrderNotification(order);
          if (!notif) {
            console.error(`[Orders POST] ❌ Notification returned null`);
          }
        } catch (err) {
          console.error(`[Orders POST] ❌ Notification creation error: ${err.message}`);
          console.error(err);
        }
      }

      // CHECK FOR OUT OF STOCK items (async, don't block response)
      checkOutOfStockNotifications().catch(err =>
        console.error(`[Orders POST] Out of stock check error: ${err.message}`)
      );

      res.status(201).json({ order: order.toObject() });
    } catch (error) {
      console.error(`[Orders POST] Error: ${error.message}`);
      res.status(500).json({ error: "Failed to create order" });
    }
  }
  
  else if (req.method === "PUT") {
    try {
      const { id } = req.query;
      const { status } = req.body;

      // Validate ID
      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ error: "Valid order ID is required" });
      }

      // Validate status
      const validStatuses = ["Pending", "Processing", "Shipped", "Delivered", "Cancelled"];
      if (!status || !validStatuses.includes(status)) {
        return res.status(400).json({ 
          error: "Invalid status", 
          validStatuses 
        });
      }

      const order = await Order.findById(id);
      if (!order) {
        return res.status(404).json({ error: "Order not found" });
      }

      const oldStatus = order.status;
      order.status = status;
      await order.save();

      // REMOVE notification when order is "Delivered"
      const newStatus = String(status).toLowerCase();
      if (newStatus === "delivered") {
        try {
          const result = await removeOrderNotifications(order._id);
        } catch (err) {
          console.error(`[Orders PUT] ❌ Remove notification error: ${err.message}`);
        }
      }

      res.status(200).json(order.toObject());
    } catch (error) {
      console.error(`[Orders PUT] Error: ${error.message}`);
      res.status(500).json({ error: "Failed to update order" });
    }
  } 
  
  else {
    res.setHeader("Allow", ["GET", "POST", "PUT"]);
    res.status(405).json({ error: `Method ${req.method} not allowed` });
  }
}
