import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";


export default async function handle(req, res) {
  const { method } = req;
  await mongooseConnect();


 if (method === "GET") {
  const { id, search } = req.query;

  try {
    await mongooseConnect();

    if (id) {
      const product = await Product.findOne({ _id: id });
      return res.json(product);
    }

    if (search) {
      const products = await Product.find({
        $or: [
          { name: { $regex: search, $options: "i" } },
          { barcode: { $regex: search, $options: "i" } },
        ],
      }).limit(10);

      return res.json(products);
    }

    const products = await Product.find();
    return res.json(products);
  } catch (error) {
    console.error("Error fetching products:", error);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch products",
    });
  }
}


  if (method === "POST") {
    try {
      const {
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
      } = req.body;
      const productDoc = await Product.create({
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
      });

      return res.json(productDoc);
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to create product" });
    }
  }

  if (req.method === "PUT") {
    try {
      const {
        name,
        description,
        costPrice,
        taxRate,
        salePriceIncTax,
        margin,
        barcode,
        category,
        images,
        properties,
        quantity,
        minStock,
        maxStock,
        _id,
      } = req.body;
      await Product.updateOne(
        { _id },
        {
          name,
          description,
          costPrice,
          taxRate,
          salePriceIncTax,
          margin,
          barcode,
          category,
          properties,
          quantity,
          minStock,
          maxStock,
          images,
        }
      );
      res.json(true);
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: "Failed to update product" });
    }
  }

  if (req.method === "DELETE") {
    if (req.query?.id) {
      try {
        await Product.deleteOne({ _id: req.query.id });
        res.json(true);
      } catch (error) {
        return res
          .status(500)
          .json({ success: false, message: "Failed to fetch this products" });
      }
    } else console.error("Error fetching products:", error);
    return res
      .status(500)
      .json({ success: false, message: "Failed to fetch products" });
  }

  return res
    .status(405)
    .json({ success: false, message: "Method not allowed" });
}
