import mongoose from "mongoose";
import { Transaction } from "@/models/Transactions";
import Staff from "@/models/Staff";
import { getCachedData, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

async function connectDB() {
  if (mongoose.connection.readyState === 1) return;
  await mongoose.connect(process.env.MONGODB_URI);
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    try {
      await connectDB();

      const { page = 1, limit = 100, days } = req.query;
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(500, Math.max(1, parseInt(limit) || 100));

      // Build cache key
      const cacheKey = CACHE_KEYS.TRANSACTIONS(pageNum, limitNum, days || "all");

      const result = await getCachedData(
        cacheKey,
        async () => {
          // Build filter - optionally filter by recent days
          const filter = {};
          if (days) {
            const daysNum = parseInt(days) || 7;
            filter.createdAt = { $gte: new Date(Date.now() - daysNum * 24 * 60 * 60 * 1000) };
          }

          const total = await Transaction.countDocuments(filter);
          const transactions = await Transaction
            .find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .populate("staff", "name")
            .lean();

          return {
            success: true,
            transactions,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          };
        },
        CACHE_TTL.TRANSACTIONS
      );

      return res.status(200).json(result);
    } catch (error) {
      console.error("Transaction GET API error:", error);
      return res.status(500).json({ success: false, message: "Internal server error" });
    }
  } else {
    res.setHeader("Allow", ["GET"]);
    res.status(405).end(`Method ${req.method} Not Allowed`);
  }
}
