import { mongooseConnect } from "@/lib/mongoose";
import Notification from "@/models/Notification";
import { ensurePendingOrderNotifications, checkOutOfStockNotifications } from "@/lib/notifications";

// Track last backfill to avoid flooding
let lastBackfillAt = 0;
const BACKFILL_INTERVAL = 2 * 60 * 1000; // 2 minutes

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (dbErr) {
    console.error("[Notifications API] DB error:", dbErr.message);
    return res.status(500).json({ success: false, message: "Database error" });
  }

  try {
    if (req.method === "GET") {
      const { limit = 20, type } = req.query;
      

      // Build filter
      let filter = {};
      if (type && type !== "all") {
        filter.type = type;
      }

      // Run backfill in BACKGROUND - don't block response
      const now = Date.now();
      if (now - lastBackfillAt > BACKFILL_INTERVAL) {
        lastBackfillAt = now;
        ensurePendingOrderNotifications().catch(err => 
          console.error("[Backfill Error]", err?.message)
        );
        // Also check for out of stock products
        checkOutOfStockNotifications().catch(err =>
          console.error("[Out of Stock Check Error]", err?.message)
        );
      }

      // DIRECT QUERY - no caching complexity
      const [notifications, unreadCount, totalCount] = await Promise.all([
        Notification.find(filter)
          .sort({ createdAt: -1 })
          .limit(Math.min(parseInt(limit) || 20, 100))
          .lean(),
        Notification.countDocuments({ isRead: false }),
        Notification.countDocuments(filter)
      ]);


      return res.json({
        success: true,
        data: notifications,
        unreadCount,
        totalCount,
      });
    }

    if (req.method === "POST") {
      const { type, title, message, referenceId, referenceType, data, priority, action } = req.body;

      if (!type || !title || !message) {
        return res.status(400).json({
          success: false,
          message: "type, title, message required",
        });
      }

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

      return res.status(201).json({ success: true, data: notification });
    }

    if (req.method === "PUT") {
      const { _id, isRead } = req.body;

      if (!_id) {
        return res.status(400).json({ success: false, message: "ID required" });
      }

      const updated = await Notification.findByIdAndUpdate(
        _id,
        { isRead, readAt: isRead ? new Date() : null },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      return res.json({ success: true, data: updated });
    }

    if (req.method === "DELETE") {
      const { _id } = req.body;

      if (!_id) {
        return res.status(400).json({ success: false, message: "ID required" });
      }

      const deleted = await Notification.findByIdAndDelete(_id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Not found" });
      }

      return res.json({ success: true, message: "Deleted" });
    }

    return res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("[Notifications API Error]", error.message);
    return res.status(500).json({ success: false, message: error.message });
  }
}
