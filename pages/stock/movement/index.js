import Layout from "@/components/Layout";
import Link from "next/link";
import { useEffect, useState } from "react";

const locations = [
  "* All Locations",
  "Warehouse A",
  "Warehouse B",
  "Storefront",
];
const reasons = [
  "* All Reasons",
  "Restock",
  "Return",
  "Transfer",
  "Adjustment",
];
const statuses = ["All Statuses", "Pending", "Received", "Cancelled"];

export default function StockMovement() {
  const [movements, setMovements] = useState([]);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [location, setLocation] = useState(locations[0]);
  const [reason, setReason] = useState(reasons[0]);
  const [status, setStatus] = useState(statuses[0]);
  const [barcode, setBarcode] = useState("");

  useEffect(() => {
    async function fetchStockMovements() {
      try {
        const res = await fetch("../../api/stock-movement/get");
        const data = await res.json();

        if (Array.isArray(data)) {
          setMovements(data);
        } else {
          console.warn("Expected array but got:", data);
          setMovements([]);
        }
      } catch (err) {
        console.error("Error fetching stock movements:", err);
        setMovements([]);
      }
    }

    fetchStockMovements();
  }, []);

  const parseDate = (dateStr) => (dateStr ? new Date(dateStr) : null);

  const filteredMovements = movements.filter((item) => {
    if (location !== "* All Locations" && item.sender !== location)
      return false;
    if (reason !== "* All Reasons" && item.reason !== reason) return false;
    if (status !== "All Statuses" && item.status !== status) return false;
    if (barcode && !item.barcode?.includes(barcode)) return false;
    if (fromDate) {
      const from = parseDate(fromDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent < from) return false;
    }
    if (toDate) {
      const to = parseDate(toDate);
      const dateSent = parseDate(item.dateSent);
      if (!dateSent || dateSent > to) return false;
    }
    return true;
  });

  return (
    <Layout>
      <div className="min-h-screen bg-[#f5f9fc] p-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-2xl font-bold text-gray-800">
            Stock Movements{" "}
            <span className="text-sm text-amber-500 ml-1 cursor-pointer hover:underline">
              HELP
            </span>
          </h1>

          <Link href="../stock/add">
            <button className="bg-amber-500 hover:bg-amber-600 text-white px-4 py-2 rounded text-sm font-semibold w-full sm:w-auto">
              ADD STOCK MOVEMENT
            </button>
          </Link>
        </div>

        {/* Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-white p-4 rounded-md shadow mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              From Date
            </label>
            <input
              type="date"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              To Date
            </label>
            <input
              type="date"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white p-4 rounded-md shadow mb-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Location
            </label>
            <select
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {locations.map((loc) => (
                <option key={loc} value={loc}>
                  {loc}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Reason
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {reasons.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Filter by Status
            </label>
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="w-full border rounded px-3 py-2"
            >
              {statuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-end gap-4 bg-white p-4 rounded-md shadow mb-6">
          <div className="flex-1">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Scan Order Barcode
            </label>
            <input
              type="text"
              placeholder="Scan barcode here"
              value={barcode}
              onChange={(e) => setBarcode(e.target.value)}
              className="w-full border rounded px-3 py-2"
            />
          </div>

          <button
            onClick={() => null}
            className="bg-amber-500 hover:bg-amber-600 text-white text-sm font-semibold px-6 py-2 rounded"
          >
            SEARCH
          </button>
        </div>

        {/* Table */}
        <div className="bg-white rounded-md shadow overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                {[
                  "TRANS REF.",
                  "FROM",
                  "TO",
                  "DATE SENT",
                  "DATE RECEIVED",
                  "TOTAL COST PRICE",
                  "STATUS",
                  "",
                ].map((head) => (
                  <th
                    key={head}
                    className="text-left px-6 py-3 font-semibold text-gray-700 uppercase tracking-wide text-xs"
                  >
                    {head}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredMovements.length === 0 ? (
                <tr>
                  <td
                    colSpan="8"
                    className="text-center text-gray-500 px-6 py-4"
                  >
                    Loading movements...
                  </td>
                </tr>
              ) : (
                filteredMovements.map((item) => (
                  <tr key={item._id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3 font-medium text-gray-900">
                      {item.transRef}
                    </td>
                    <td className="px-6 py-3 text-gray-700">{item.sender}</td>
                    <td className="px-6 py-3 text-gray-700">{item.receiver}</td>
                    <td className="px-6 py-3 text-gray-700">
                      {new Date(item.dateSent).toLocaleString()}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      {item.dateReceived
                        ? new Date(item.dateReceived).toLocaleString()
                        : "---"}
                    </td>
                    <td className="px-6 py-3 text-gray-700">
                      ₦
                      {item.totalCostPrice.toLocaleString(undefined, {
                        minimumFractionDigits: 2,
                      })}
                    </td>
                    <td
                      className={`px-6 py-3 font-semibold ${
                        item.status === "Received"
                          ? "text-green-600"
                          : item.status === "Pending"
                          ? "text-yellow-600"
                          : "text-red-600"
                      }`}
                    >
                      {item.status}
                    </td>
                    <td className="px-6 py-3 text-right">
                      <Link href={`/stock/movement/${item._id}`}>
                        <span className="inline-block bg-amber-100 hover:bg-amber-200 text-amber-800 font-medium px-3 py-1 rounded text-xs shadow-sm transition duration-150 ease-in-out">
                          VIEW DETAILS
                        </span>
                      </Link>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
