import { mongooseConnect } from "@/lib/mongoose";
import { Staff } from "@/models/Staff";
import bcrypt from "bcryptjs";
import { getCachedData, invalidateCache, CACHE_KEYS, CACHE_TTL } from "@/lib/cache";

// Validation constants
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,30}$/;
const PIN_REGEX = /^\d{4}$/;

/**
 * Validate staff data
 */
const validateStaffData = (data, isUpdate = false) => {
  const errors = [];
  
  if (!isUpdate || data.name !== undefined) {
    if (!data.name || typeof data.name !== "string" || data.name.trim().length < 2) {
      errors.push("Name must be at least 2 characters");
    }
  }
  
  if (!isUpdate || data.username !== undefined) {
    const username = data.username?.trim().toLowerCase();
    if (!username || !USERNAME_REGEX.test(username)) {
      errors.push("Username must be 3-30 characters, containing only letters, numbers, and underscores");
    }
  }
  
  if (!isUpdate || data.password !== undefined) {
    if (!isUpdate && (!data.password || !PIN_REGEX.test(data.password))) {
      errors.push("PIN must be exactly 4 digits");
    }
    if (isUpdate && data.password && !PIN_REGEX.test(data.password)) {
      errors.push("PIN must be exactly 4 digits");
    }
  }
  
  if (data.role && !['staff', 'manager'].includes(data.role)) {
    errors.push("Role must be 'staff' or 'manager'");
  }
  
  return errors;
};

export default async function handler(req, res) {
  try {
    await mongooseConnect();
  } catch (err) {
    console.error("[Staff API] Database connection error:", err.message);
    return res.status(500).json({ error: "Database connection failed" });
  }

  if (req.method === "GET") {
    try {
      const { active, role, page = 1, limit = 50 } = req.query;
      
      const pageNum = Math.max(1, parseInt(page) || 1);
      const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 50));
      
      // Build cache key with filters
      const filterKey = `${active || "all"}_${role || "all"}`;
      const cacheKey = `${CACHE_KEYS.STAFF(pageNum, limitNum)}:${filterKey}`;
      
      const result = await getCachedData(
        cacheKey,
        async () => {
          // Build query filter
          const filter = {};
          if (active !== undefined) {
            filter.isActive = active === "true" || active === "1";
          }
          if (role && ['staff', 'manager'].includes(role)) {
            filter.role = role;
          }
          
          const total = await Staff.countDocuments(filter);
          const staff = await Staff.find(filter)
            .select("-password") // Never return passwords
            .sort({ createdAt: -1 })
            .skip((pageNum - 1) * limitNum)
            .limit(limitNum)
            .lean();
            
          return {
            staff,
            pagination: {
              page: pageNum,
              limit: limitNum,
              total,
              totalPages: Math.ceil(total / limitNum),
            },
          };
        },
        CACHE_TTL.STAFF
      );
        
      return res.status(200).json(result);
    } catch (error) {
      console.error("[Staff GET] Error:", error.message);
      return res.status(500).json({ error: "Failed to fetch staff" });
    }
  }

  if (req.method === "POST") {
    const { name, username, password, role } = req.body;

    // Validate input
    const validationErrors = validateStaffData(req.body);
    if (validationErrors.length > 0) {
      return res.status(400).json({ 
        error: "Validation failed", 
        errors: validationErrors 
      });
    }

    try {
      const sanitizedUsername = username.trim().toLowerCase();
      
      // Check for existing username
      const existing = await Staff.findOne({ username: sanitizedUsername });
      if (existing) {
        return res.status(400).json({ error: "Username already exists" });
      }

      const hashedPassword = await bcrypt.hash(password, 12);
      const staff = await Staff.create({
        name: name.trim(),
        username: sanitizedUsername,
        password: hashedPassword,
        role: role || "staff",
        isActive: true,
      });
      
      // Invalidate cache after create
      invalidateCache("staff");
      
      // Return without password
      const { password: _, ...staffData } = staff.toObject();
      return res.status(201).json(staffData);
    } catch (error) {
      console.error("[Staff POST] Error:", error.message);
      
      // Handle MongoDB duplicate key error
      if (error.code === 11000) {
        return res.status(400).json({ error: "Username already exists" });
      }
      
      return res.status(500).json({ error: "Failed to create staff" });
    }
  }

  res.setHeader("Allow", ["GET", "POST"]);
  return res.status(405).json({ error: `Method ${req.method} not allowed` });
}
