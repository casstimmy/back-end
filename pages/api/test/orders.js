/**
 * Simple test endpoint to diagnose orders API issues
 * GET /api/test/orders
 */

export default async function handler(req, res) {
  // Endpoint deprecated and removed
  return res.status(410).json({
    success: false,
    message: "Deprecated endpoint. Use /api/orders and /api/notifications",
  });
}
