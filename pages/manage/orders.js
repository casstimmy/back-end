import { useEffect, useState } from "react";
import { Search, X, Mail } from "lucide-react";
import clsx from "clsx";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";

export default function OrderInventoryPage() {
  const [orders, setOrders] = useState([]);
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedOrder, setSelectedOrder] = useState(null);

  const entriesPerPage = 10;
  const statusOptions = ["Pending", "Shipped", "Delivered"];

  const statusClass = {
    Pending: "bg-yellow-100 text-yellow-800",
    Shipped: "bg-blue-100 text-blue-800",
    Delivered: "bg-green-100 text-green-800",
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      const { data } = await axios.get("/api/orders");
      const ordersWithDate = data
        .map((order) => ({
          ...order,
          date: new Date(order.createdAt).toISOString(),
        }))
        .sort((a, b) => new Date(b.date) - new Date(a.date));
      setOrders(ordersWithDate);
    } catch {
      setOrders([]);
    }
  };

  const updateStatus = async (orderId, newStatus) => {
    try {
      const response = await axios.put(`/api/orders/${orderId}`, {
        status: newStatus,
      });

      const updatedOrder = response.data;

      if (newStatus === "Delivered") {
        await axios.post("/api/transactions/from-order", {
          orderId: updatedOrder._id,
        });
        alert("Order marked as delivered and saved as a transaction.");
      }

      setOrders((prev) =>
        prev.map((order) =>
          order._id === orderId ? { ...order, status: newStatus } : order
        )
      );
    } catch {
      alert("Failed to update status.");
    }
  };

  const filteredOrders = orders.filter(
    ({ customer, _id }) =>
      customer?.name?.toLowerCase().includes(search.toLowerCase()) ||
      _id.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.ceil(filteredOrders.length / entriesPerPage);
  const paginatedOrders = filteredOrders.slice(
    (currentPage - 1) * entriesPerPage,
    currentPage * entriesPerPage
  );

  const goToPage = (page) => {
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
  };

  const handleSendEmail = async () => {
    if (!selectedOrder?.customer?.email) {
      alert("Customer email not available.");
      return;
    }

    const subject = "Your Order Details from Our Store";

    const productLines = (selectedOrder.products || [])
      .map(
        (p) =>
          `- ${p.name} x ${p.quantity} = ₦${(p.price * p.quantity).toLocaleString()}`
      )
      .join("\n");

    const body =
      `Dear ${selectedOrder.customer.name || "Customer"},\n\n` +
      `Here are the details of your order (ID: ${selectedOrder._id}):\n\n` +
      (productLines || "No product details available.") +
      `\n\nTotal: ₦${(selectedOrder.total || 0).toLocaleString()}` +
      `\nStatus: ${selectedOrder.status}\n\nThank you for shopping with us!`;

    try {
      await axios.post("/api/send-email", {
        to: selectedOrder.customer.email,
        subject,
        text: body,
      });
      alert("Email sent successfully.");
      setSelectedOrder(null);
    } catch {
      alert("Failed to send email.");
    }
  };

  return (
    <Layout>
      <div className="w-full border-b p-4 shadow-md">
        <div className="flex items-center justify-between mb-4">
          <h1 className="text-3xl text-blue-900 font-bold mb-2">Order Inventory</h1>
          <Link href="">
            <div className="py-2 px-6 bg-blue-600 text-white rounded-sm">
              Order Inventory
            </div>
          </Link>
        </div>

        {/* Search */}
        <div className="flex flex-col gap-8 sm:flex-row items-center justify-between mb-4 w-full">
          <div className="relative w-full">
            <span className="absolute left-3 top-3.5 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="search"
              placeholder="Search by customer or order ID"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setCurrentPage(1);
              }}
              className="w-full pl-10 pr-4 py-3 border rounded-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-200 text-gray-700"
            />
          </div>
        </div>

        {/* Orders Table */}
        <table className="w-full border-collapse table-auto">
          <thead className="bg-gray-100">
            <tr>
              {["Order ID", "Customer", "Total (₦)", "Status", "Date"].map(
                (header) => (
                  <th
                    key={header}
                    className="text-left text-xs font-semibold text-gray-600 uppercase py-3 px-4 border-b"
                  >
                    {header}
                  </th>
                )
              )}
            </tr>
          </thead>
          <tbody>
            {paginatedOrders.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center py-10 text-gray-400 italic">
                  No orders found.
                </td>
              </tr>
            ) : (
              paginatedOrders.map(({ _id, customer, total, status, date }) => (
                <tr
                  key={_id}
                  onClick={() => setSelectedOrder(orders.find((o) => o._id === _id))}
                  className="hover:bg-blue-50 cursor-pointer"
                >
                  <td className="font-mono text-blue-700 px-4 py-3">{_id}</td>
                  <td className="px-4 py-3">{customer?.name || "N/A"}</td>
                  <td className="font-semibold text-gray-900 px-4 py-3">
                    ₦{(total ?? 0).toLocaleString(undefined, {
                      minimumFractionDigits: 2,
                    })}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <select
                      value={status}
                      onClick={(e) => e.stopPropagation()}
                      onChange={(e) => updateStatus(_id, e.target.value)}
                      className={clsx(
                        "px-3 py-1 rounded-full text-xs font-semibold",
                        statusClass[status] || "bg-gray-200 text-gray-600"
                      )}
                    >
                      {statusOptions.map((opt) => (
                        <option key={opt} value={opt}>
                          {opt}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-4 py-3">
                    {date
                      ? new Date(date).toLocaleDateString("en-NG", {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                        })
                      : "N/A"}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>

        {/* Pagination */}
        <nav className="mt-6 flex justify-center space-x-2" aria-label="Pagination">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 1}
            className={clsx(
              "px-3 py-1 rounded border transition",
              currentPage === 1
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-blue-600 border-blue-600 hover:bg-blue-100"
            )}
          >
            Previous
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => goToPage(page)}
              className={clsx(
                "px-3 py-1 rounded border transition",
                page === currentPage
                  ? "bg-blue-600 text-white border-blue-600"
                  : "text-blue-600 border-blue-600 hover:bg-blue-100"
              )}
            >
              {page}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages}
            className={clsx(
              "px-3 py-1 rounded border transition",
              currentPage === totalPages
                ? "text-gray-400 border-gray-300 cursor-not-allowed"
                : "text-blue-600 border-blue-600 hover:bg-blue-100"
            )}
          >
            Next
          </button>
        </nav>
      </div>

      {/* Order Details Modal */}
      {selectedOrder && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50"
          role="dialog"
          aria-modal="true"
        >
          <div className="bg-white rounded-lg shadow-lg max-w-lg w-full p-6 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setSelectedOrder(null)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              aria-label="Close"
            >
              <X />
            </button>
            <h3 className="text-xl font-bold mb-4">Order Details</h3>
            <p><strong>Order ID:</strong> {selectedOrder._id}</p>
            <p><strong>Customer:</strong> {selectedOrder.customer?.name || "N/A"}</p>
            <p><strong>Email:</strong> {selectedOrder.customer?.email || "N/A"}</p>
            <p><strong>Phone:</strong> {selectedOrder.customer?.phone || "N/A"}</p>
            <p><strong>Total:</strong> ₦{(selectedOrder.total ?? 0).toLocaleString()}</p>
            <p><strong>Status:</strong> {selectedOrder.status}</p>
            <p><strong>Date:</strong> {new Date(selectedOrder.createdAt).toLocaleString()}</p>
            <hr className="my-4" />
            <div>
              <strong>Products:</strong>
              <ul className="list-disc list-inside mt-2 text-sm text-gray-700">
                {(selectedOrder.products || []).map((product, idx) => (
                  <li key={idx}>
                    {product.name} x {product.quantity} - ₦{((product.price || 0) * (product.quantity || 0)).toLocaleString()}
                  </li>
                ))}
              </ul>
            </div>
            <button
              onClick={handleSendEmail}
              className="mt-6 w-full flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 px-4 rounded shadow transition"
            >
              <Mail className="w-4 h-4" />
              Send Email to Customer
            </button>
          </div>
        </div>
      )}
    </Layout>
  );
}
