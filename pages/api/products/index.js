// pages/api/products.js
import { mongooseConnect } from "@/lib/mongoose";
import { Product } from "@/models/Product";
import mongoose from "mongoose";
import { getCachedData, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

// Validation helpers
const validateProductData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
      errors.push("Product name must be at least 2 characters");
    }
  }
  
  if (!isUpdate || data.description !== undefined) {
    if (!data.description || typeof data.description !== "string") {
      errors.push("Product description is required");
    }
  }
  
  if (!isUpdate || data.costPrice !== undefined) {
    const cost = parseFloat(data.costPrice);
    if (isNaN(cost) || cost < 0) {
      errors.push("Cost price must be a valid positive number");
    }
  }
  
  if (!isUpdate || data.salePriceIncTax !== undefined) {
    const sale = parseFloat(data.salePriceIncTax);
    if (isNaN(sale) || sale < 0) {
      errors.push("Sale price must be a valid positive number");
    }
  }
  
  if (data.taxRate !== undefined) {
    const tax = parseFloat(data.taxRate);
    if (isNaN(tax) || tax < 0 || tax > 100) {
      errors.push("Tax rate must be between 0 and 100");
    }
  }
  
  if (data.quantity !== undefined) {
    const qty = parseInt(data.quantity);
    if (isNaN(qty) || qty < 0) {
      errors.push("Quantity must be a non-negative number");
    }
  }
  
  if (data.minStock !== undefined) {
    const min = parseInt(data.minStock);
    if (isNaN(min) || min < 0) {
      errors.push("Minimum stock must be a non-negative number");
    }
  }
  
  if (data.isPromotion && data.promoPrice !== undefined) {
    const promo = parseFloat(data.promoPrice);
    if (isNaN(promo) || promo < 0) {
      errors.push("Promo price must be a valid positive number");
    }
  }
  
  return errors;
};

// Sanitize search input to prevent regex injection
const sanitizeRegex = (str) => {
  if (!str || typeof str !== "string") return "";
  return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
};

export default async function handler(req, res) {
  const { method } = req;
  
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[Products API] Database connection error:", err.message);
    return res.status(500).json({ success: false, message: "Database connection failed" });
  }

  try {
    if (method === "GET") {
      const { id, search, promo, promoType, page = 1, limit = 50 } = req.query;
      
      // Parse pagination params
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));

      if (id) {
        // Validate ObjectId
        if (!mongoose.Types.ObjectId.isValid(id)) {
          return res.status(400).json({ success: false, message: "Invalid product ID format" });
        }
        
        const product = await Product.findById(id).lean();
        if (!product) {
          return res.status(404).json({ success: false, message: "Product not found" });
        }
        return res.json(product);
      }

      if (search) {
        // Sanitize search input
        const sanitizedSearch = sanitizeRegex(search.trim());
        if (!sanitizedSearch) {
          return res.json({ success: true, data: [] });
        }
        
        // Cache search results for short period
        const cacheKey = CACHE_KEYS.PRODUCTS_SEARCH(sanitizedSearch);
        const products = await getCachedData(
          cacheKey,
          async () => {
            return await Product.find({
              $or: [
                { name: { $regex: sanitizedSearch, $options: "i" } },
                { barcode: { $regex: sanitizedSearch, $options: "i" } },
              ],
            })
              .limit(limitNum)
              .lean();
          },
          30 // 30 seconds cache for search
        );

        return res.json({ success: true, data: products });
      }

      // Filter by promotion status and type
      let filter = {};
      if (promo === "yes" || promo === "true" || promo === "Yes") {
        filter.isPromotion = true;
        if (promoType && typeof promoType === "string") {
          filter.promoType = sanitizeRegex(promoType);
        }
      }

      // Build cache key for product list
      const filterKey = promo ? `promo_${promoType || "all"}` : "all";
      const cacheKey = CACHE_KEYS.PRODUCTS(pageNum, limitNum, filterKey);

      const result = await getCachedData(
        cacheKey,
        async () => {
          const total = await Product.countDocuments(filter);
          const products = await Product.find(filter)
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
            
          return { 
            success: true, 
            data: products,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            }
          };
        },
        CACHE_TTL.PRODUCTS
      );
        
      return res.json(result);
    }

    if (method === "POST") {
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
        isPromotion,
        promoPrice,
        promoType,
        promoStart,
        promoEnd,
      } = req.body;

      // Validate input
      const validationErrors = validateProductData(req.body);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const productDoc = await Product.create({
        name: name.trim(),
        description: description.trim(),
        costPrice: parseFloat(costPrice),
        taxRate: parseFloat(taxRate) || 0,
        salePriceIncTax: parseFloat(salePriceIncTax),
        margin: parseFloat(margin) || 0,
        barcode: barcode?.trim() || null,
        category: category || "Top Level",
        images: images || [],
        properties: properties || [],
        quantity: parseInt(quantity) || 0,
        minStock: parseInt(minStock) || 0,
        maxStock: parseInt(maxStock) || 0,
        isPromotion: Boolean(isPromotion),
        promoPrice: isPromotion ? parseFloat(promoPrice) || null : null,
        promoType: isPromotion ? promoType : null,
        promoStart: isPromotion && promoStart ? new Date(promoStart) : null,
        promoEnd: isPromotion && promoEnd ? new Date(promoEnd) : null,
      });

      // Invalidate products cache
      invalidateCache("products");

      return res.status(201).json({
        success: true,
        message: "Product created successfully",
        data: productDoc,
      });
    }

    if (method === "PUT") {
      const {
        _id,
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
        isPromotion,
        promoPrice,
        promoType,
        promoStart,
        promoEnd,
      } = req.body;

      if (!_id || !mongoose.Types.ObjectId.isValid(_id)) {
        return res.status(400).json({ success: false, message: "Valid product ID required" });
      }

      // Validate input
      const validationErrors = validateProductData(req.body, true);
      if (validationErrors.length > 0) {
        return res.status(400).json({ 
          success: false, 
          message: "Validation failed",
          errors: validationErrors,
        });
      }

      const updateData = {
        ...(name && { name: name.trim() }),
        ...(description && { description: description.trim() }),
        ...(costPrice !== undefined && { costPrice: parseFloat(costPrice) }),
        ...(taxRate !== undefined && { taxRate: parseFloat(taxRate) || 0 }),
        ...(salePriceIncTax !== undefined && { salePriceIncTax: parseFloat(salePriceIncTax) }),
        ...(margin !== undefined && { margin: parseFloat(margin) || 0 }),
        ...(barcode !== undefined && { barcode: barcode?.trim() || null }),
        ...(category && { category }),
        ...(images && { images }),
        ...(properties && { properties }),
        ...(quantity !== undefined && { quantity: parseInt(quantity) || 0 }),
        ...(minStock !== undefined && { minStock: parseInt(minStock) || 0 }),
        ...(maxStock !== undefined && { maxStock: parseInt(maxStock) || 0 }),
        isPromotion: Boolean(isPromotion),
        promoPrice: isPromotion ? parseFloat(promoPrice) || null : null,
        promoType: isPromotion ? promoType : null,
        promoStart: isPromotion && promoStart ? new Date(promoStart) : null,
        promoEnd: isPromotion && promoEnd ? new Date(promoEnd) : null,
      };

      const updated = await Product.findByIdAndUpdate(
        _id,
        updateData,
        { new: true, runValidators: true }
      );

      if (!updated) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // Invalidate products cache
      invalidateCache("products");

      return res.json({
        success: true,
        message: "Product updated successfully",
        data: updated,
      });
    }

    if (method === "DELETE") {
      const { id } = req.query;

      if (!id || !mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Valid product ID required" });
      }

      const deleted = await Product.findByIdAndDelete(id);

      if (!deleted) {
        return res.status(404).json({ success: false, message: "Product not found" });
      }

      // Invalidate products cache
      invalidateCache("products");

      return res.json({
        success: true,
        message: "Product deleted successfully",
      });
    }

    return res.status(405).json({
      success: false,
      message: `Method ${method} not allowed`,
    });
  } catch (error) {
    console.error("[Products API] Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error, please try again",
    });
  }
}
