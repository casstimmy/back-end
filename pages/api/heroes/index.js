import { mongooseConnect } from "@/lib/mongoose";
import Hero from "@/models/Hero";

export default async function handler(req, res) {
  await mongooseConnect();

  try {
    if (req.method === "GET") {
      const heroes = await Hero.find().sort({ order: 1, createdAt: -1 });
      return res.json(heroes);
    }

    if (req.method === "POST") {
      const { title, subtitle, image, bgImage, ctaText, ctaLink, promotion, order, status } = req.body;

      console.log("POST /api/heroes - Received payload with promotion:", promotion);
      console.log("Full payload:", { title, subtitle, ctaText, ctaLink, promotion, order, status });

      if (!title || !Array.isArray(image) || image.length === 0 || !image[0]?.full || !image[0]?.thumb) {
        return res.status(400).json({ error: "Title and at least one Hero Image (full + thumb) are required" });
      }

      if (Array.isArray(bgImage) && bgImage.length > 0 && (!bgImage[0]?.full || !bgImage[0]?.thumb)) {
        return res.status(400).json({ error: "Background image must include full + thumb" });
      }

      const createData = {
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

      console.log("Creating hero with data:", createData);

      const hero = await Hero.create(createData);
      
      console.log("Created hero document:", JSON.stringify(hero, null, 2));
      
      return res.status(201).json(hero);
    }

    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  } catch (err) {
    console.error("Hero API error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
