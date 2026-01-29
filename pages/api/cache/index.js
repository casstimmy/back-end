// API endpoint to manage cache
import cache, { invalidateCache } from "@/lib/cache";

export default async function handler(req, res) {
  // Only allow authorized requests (check for admin or use API key)
  const authHeader = req.headers.authorization;
  const apiKey = process.env.CACHE_API_KEY || "admin-cache-key";
  
  if (authHeader !== `Bearer ${apiKey}`) {
    return res.status(401).json({ error: "Unauthorized" });
  }

  if (req.method === "GET") {
    // Get cache statistics
    const stats = cache.stats();
    return res.status(200).json({
      success: true,
      stats: {
        size: stats.size,
        keys: stats.keys,
      },
    });
  }

  if (req.method === "DELETE") {
    const { type } = req.query;
    
    if (type) {
      // Invalidate specific cache type
      invalidateCache(type);
      return res.status(200).json({
        success: true,
        message: `Cache invalidated for type: ${type}`,
      });
    } else {
      // Clear all cache
      cache.clear();
      return res.status(200).json({
        success: true,
        message: "All cache cleared",
      });
    }
  }

  res.setHeader("Allow", ["GET", "DELETE"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
