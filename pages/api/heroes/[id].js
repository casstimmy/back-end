// pages/api/heroes/[id].js
import { mongooseConnect } from "@/lib/mongoose";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  await mongooseConnect(); // ✅ ensure DB connection

  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Hero ID is required" });
  }

  try {
    if (req.method === "GET") {
      const hero = await Hero.findById(id);
      if (!hero) return res.status(404).json({ error: "Hero not found" });
      return res.json(hero);
    }

    if (req.method === "PUT") {
      const { title, subtitle, image, bgImage, ctaText, ctaLink, promotion, order, status } = req.body;

      console.log("PUT /api/heroes/[id] - Received payload:", {
        id,
        title,
        promotion,
        ctaText,
        ctaLink,
      });

      // ✅ validate required fields
      if (!title || !Array.isArray(image) || image.length === 0 || !image[0]?.full || !image[0]?.thumb) {
        return res.status(400).json({ error: "Title and at least one Hero Image (full + thumb) are required" });
      }

      if (Array.isArray(bgImage) && bgImage.length > 0 && (!bgImage[0]?.full || !bgImage[0]?.thumb)) {
        return res.status(400).json({ error: "Background image must include full + thumb" });
      }

      // Build update object with all fields
      const updateData = {
        title,
        subtitle,
        image,
        bgImage,
        ctaText,
        ctaLink,
        promotion,
        order,
        status,
      };

      console.log("Update data being sent to DB:", updateData);

      const updated = await Hero.findByIdAndUpdate(
        id,
        updateData,
        { new: true, runValidators: true }
      );

      console.log("Updated hero from DB:", JSON.stringify(updated, null, 2));

      if (!updated) return res.status(404).json({ error: "Hero not found" });
      return res.json(updated);
    }

    if (req.method === "DELETE") {
      const deleted = await Hero.findByIdAndDelete(id);
      if (!deleted) return res.status(404).json({ error: "Hero not found" });
      return res.json({ message: "Hero deleted successfully" });
    }

    // Method not allowed
    res.setHeader("Allow", ["GET", "PUT", "DELETE"]);
    return res.status(405).end(`Method ${req.method} Not Allowed`);
  } catch (err) {
    console.error("Hero API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
