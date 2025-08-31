import Layout from "@/components/Layout";
import { useState, useEffect } from "react";

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    async function fetchProducts() {
      try {
        const res = await fetch("/api/products");
        if (!res.ok) throw new Error("Failed to fetch products");
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      }
    }

    fetchProducts();
  }, []);

  const filteredItems = products.filter(
    (item) =>
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalStock = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const totalIncoming = 240; // Replace with real data if needed
  const totalOutgoing = 85;
  const lowStockCount = products.filter((p) => p.quantity < (p.minStock || 10)).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10">
          <h1 className="text-3xl text-blue-900 font-bold mb-2">Stock Management</h1>
          <p className="text-gray-600">Monitor all stock levels and alerts in real-time.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Stock" value={`${totalStock} units`} />
          <StatCard label="Incoming Stock" value={`${totalIncoming} units`} />
          <StatCard label="Outgoing Stock" value={`${totalOutgoing} units`} />
          <StatCard label="Low Stock Alerts" value={lowStockCount} highlight />
        </section>

        <div className="mb-6 max-w-xl">
          <input
            type="text"
            placeholder="Search by product or category..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-600"
          />
        </div>

        <section className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                {["Name", "Category", "Stock Qty", "Unit Cost", "Status"].map((header) => (
                  <th
                    key={header}
                    className="px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-4 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                filteredItems.map((product) => {
                  const status =
                    product.quantity === 0
                      ? "Out of Stock"
                      : product.quantity < (product.minStock || 10)
                      ? "Low Stock"
                      : "In Stock";

                  return (
                    <tr key={product._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4">{product.name}</td>
                      <td className="px-6 py-4">{product.category}</td>
                      <td className="px-6 py-4">{product.quantity ?? 0}</td>
                      <td className="px-6 py-4">₦{(product.costPrice || 0).toLocaleString()}</td>
                      <td
                        className={`px-6 py-4 font-semibold ${
                          status === "In Stock"
                            ? "text-green-600"
                            : status === "Low Stock"
                            ? "text-yellow-600"
                            : "text-red-600"
                        }`}
                      >
                        {status}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, highlight = false }) {
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 flex flex-col items-center ${
        highlight ? "border-2 border-yellow-400" : ""
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
