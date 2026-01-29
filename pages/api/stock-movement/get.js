// /pages/api/stock-movement/get.js

import { mongooseConnect } from "@/lib/mongoose";
import { StockMovement } from "@/models/StockMovement";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 50 } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(200, Math.max(1, parseInt(limit) || 50));

      const cacheKey = CACHE_KEYS.STOCK_MOVEMENTS(pageNum, limitNum);

      const result = await getCachedData(
        cacheKey,
        async () => {
          const total = await StockMovement.countDocuments();
          const data = await StockMovement.find({})
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("products.id", "costPrice name")
            .lean();

          const movements = data.map((m) => {
            const totalCostPrice = (m.products || []).reduce((sum, p) => {
              const cost = p.id?.costPrice || 0;
              return sum + cost * (p.quantity || 0);
            }, 0);

            return {
              _id: m._id,
              transRef: m.transRef,
              sender: m.fromLocation,
              receiver: m.toLocation,
              reason: m.reason,
              staff: m.staff,
              dateSent: m.createdAt,
              dateReceived: m.updatedAt,
              totalCostPrice,
              status: m.status || "Received",
              barcode: m.barcode || "",
            };
          });

          return {
            movements,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          };
        },
        CACHE_TTL.STOCK_MOVEMENT
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Fetch stock movement failed:", error);
      return res.status(500).json({ error: "Internal Server Error" });
    }
  }

  return res.status(405).json({ message: "Method Not Allowed" });
}
