import { checkEndedPromotions, checkLowStockNotifications, checkOutOfStockNotifications } from "@/lib/notifications";

export default async function handler(req, res) {
  // Optional: Add authentication/API key check
  const apiKey = req.headers["x-cron-key"] || req.query.key;
  if (apiKey !== process.env.CRON_KEY) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  try {
    console.log("[Cron Job] Starting notification checks...");

    // Check for ended promotions
    await checkEndedPromotions();

    // Check for low stock
    await checkLowStockNotifications();

    // Check for out of stock
    await checkOutOfStockNotifications();

    return res.status(200).json({
      success: true,
      message: "Notification checks completed successfully",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("[Cron Job] Error:", error);
    return res.status(500).json({
      success: false,
      error: error.message,
    });
  }
}
