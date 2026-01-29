import { mongooseConnect } from "@/lib/mongoose";
import { Category } from "@/models/Category";
import { getCachedData, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

export default async function handler(req, res) {
  const { method } = req;
  await mongooseConnect();

  try {
    if (method === "GET") {
      // Use cache for categories (rarely changes)
      const categories = await getCachedData(
        CACHE_KEYS.CATEGORIES(),
        async () => {
          return await Category.find().populate("parent").lean();
        },
        CACHE_TTL.CATEGORIES
      );
      return res.json(categories);
    }

    if (method === "POST") {
      let { name, parentCategory, properties, images } = req.body;
      if (!name || !images?.length)
        return res.status(400).json({ success: false, message: "Name and at least one image are required" });

      // --- FIX: Normalize images ---
      images = images.map(img => ({
        full: typeof img.full === "string" ? img.full : img.full?.webp || img.full?.jpeg || "",
        thumb: typeof img.thumb === "string" ? img.thumb : img.thumb?.webp || img.thumb?.jpeg || "",
      }));

      const category = await Category.create({
        name,
        parent: parentCategory || null,
        properties: properties || [],
        images,
      });

      const populatedCategory = await Category.findById(category._id).populate("parent");
      
      // Invalidate cache after create
      invalidateCache("categories");
      
      return res.json(populatedCategory);
    }

    if (method === "PUT") {
      let { _id, name, parentCategory, properties, images } = req.body;
      if (!_id) return res.status(400).json({ success: false, message: "Category ID is required" });

      // --- FIX: Normalize images ---
      images = images.map(img => ({
        full: typeof img.full === "string" ? img.full : img.full?.webp || img.full?.jpeg || "",
        thumb: typeof img.thumb === "string" ? img.thumb : img.thumb?.webp || img.thumb?.jpeg || "",
      }));

      const updatedCategory = await Category.findByIdAndUpdate(
        _id,
        {
          name,
          parent: parentCategory || null,
          properties: properties || [],
          images,
        },
        { new: true }
      ).populate("parent");

      // Invalidate cache after update
      invalidateCache("categories");
      
      return res.json(updatedCategory);
    }

    if (method === "DELETE") {
      const { id } = req.query;
      if (!id) return res.status(400).json({ success: false, message: "Category ID required" });

      await Category.deleteOne({ _id: id });
      
      // Invalidate cache after delete
      invalidateCache("categories");
      
      return res.json({ success: true });
    }

    res.status(405).json({ success: false, message: "Method not allowed" });
  } catch (error) {
    console.error("Category API error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
}
