// pages/api/setup.js
import { mongooseConnect } from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import mongoose from "mongoose";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  const {
    storeName,
    storePhone,
    country,
    locations = [],
    featuredProductId,
    adminName,
    adminEmail,
    adminPassword,
  } = req.body;

  try {
    await mongooseConnect();

    // Hash password
    const hashedPassword = await bcrypt.hash(adminPassword, 10);

    // Prepare store data object
    const storeData = {
      storeName,
      storePhone,
      country,
      locations,
    };

    // Validate and assign featuredProductId if it's valid
    if (featuredProductId && mongoose.Types.ObjectId.isValid(featuredProductId)) {
      storeData.featuredProductId = new mongoose.Types.ObjectId(featuredProductId);
    }

    // Create or update the store
    const store = await Store.findOneAndUpdate(
      {},
      storeData,
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // Create or update the admin user
    const user = await User.findOneAndUpdate(
      { email: adminEmail },
      {
        name: adminName,
        email: adminEmail,
        password: hashedPassword,
        role: "admin",
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return res.status(200).json({ message: "Store setup complete", store, user });
  } catch (error) {
    console.error("Setup error:", error);
    return res.status(500).json({ message: "Internal Server Error" });
  }
}
