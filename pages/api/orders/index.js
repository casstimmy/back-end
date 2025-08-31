import { mongooseConnect } from "@/lib/mongoose";
import Order from "@/models/Order";
import Customer from "@/models/Customer";

export default async function handler(req, res) {
  await mongooseConnect();

  if (req.method === "GET") {
    try {
      const orders = await Order.find().sort({ createdAt: -1 });

      // Manually fetch and attach customer data
      const ordersWithCustomer = await Promise.all(
        orders.map(async (order) => {
          const customer = await Customer.findById(order.customer).lean();
          return {
            ...order.toObject(),
            customer, // now the full customer object is attached
          };
        })
      );

      res.status(200).json(ordersWithCustomer);
    } catch (error) {
      res.status(500).json({ error: "Internal Server Error" });
    }
  }
  
}
