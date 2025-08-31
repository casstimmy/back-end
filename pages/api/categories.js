import { mongooseConnect } from "@/lib/mongoose";
import { Category } from "@/models/Category";

export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();

  if (method === "GET") {
    try {
      const { id } = req.query;

      if (id) {
        const category = await Category.findById(id).populate("parent");
        if (!category) {
          return res
            .status(404)
            .json({ success: false, message: "Category not found" });
        }
        return res.json(category);
      }

      const categories = await Category.find().populate("parent");
      return res.json(categories);
    } catch (error) {
      console.error("Error fetching categories:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to fetch categories" });
    }
  }

  if (method === "POST") {
    const { name, parentCategory, properties, image } = req.body;
    try {
      const categoryDoc = await Category.create({
        name,
        parent: parentCategory || null,
        properties: properties || [],
        image: image || "", // <-- save image
      });

      const populatedCategory = await Category.findById(categoryDoc._id).populate("parent");
      return res.json(populatedCategory);
    } catch (error) {
      console.error("Error creating category:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to create category" });
    }
  }

  if (method === "PUT") {
    const { name, parentCategory, properties, image, _id } = req.body;
    try {
      const updatedCategory = await Category.findByIdAndUpdate(
        _id,
        {
          name,
          parent: parentCategory || null,
          properties: properties || [],
          image: image || "", // <-- update image
        },
        { new: true }
      ).populate("parent");

      return res.json(updatedCategory);
    } catch (error) {
      console.error("Error updating category:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to update category" });
    }
  }

  if (method === "DELETE") {
    const { id } = req.query;
    if (!id) return res.status(400).json({ success: false, message: "Category ID required" });

    try {
      await Category.deleteOne({ _id: id });
      return res.json({ success: true });
    } catch (error) {
      console.error("Error deleting category:", error);
      return res
        .status(500)
        .json({ success: false, message: "Failed to delete category" });
    }
  }
}
