import { mongooseConnect } from "@/lib/mongoose";
import Store from "@/models/Store";
import User from "@/models/User";

export default async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ message: "Method not allowed" });
  }

  try {
    await mongooseConnect();

    const store = await Store.findOne({});
    const user = await User.findOne({ role: "admin" });

    return res.status(200).json({ store, user });
  } catch (err) {
    console.error("Fetch setup error:", err);
    res.status(500).json({ message: "Internal Server Error" });
  }
}
