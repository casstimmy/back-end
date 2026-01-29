// SalesReport.js
import Layout from "@/components/Layout";
import { useEffect, useState } from "react";
import { saveAs } from "file-saver";

export default function SalesReport() {
  const [transactions, setTransactions] = useState([]);
  const [expandedTxId, setExpandedTxId] = useState(null);
  const [locationFilter, setLocationFilter] = useState("");
  const [locations, setLocations] = useState([]);
  const [selectedDate, setSelectedDate] = useState(null);
  const [showBarcode, setShowBarcode] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, [locationFilter, selectedDate]);

async function fetchTransactions() {
  try {
    const res = await fetch("/api/transactions/transactions");
    if (!res.ok) throw new Error("Failed to fetch transactions");
    const data = await res.json();
    let filtered = data.transactions || [];

    // Extract unique locations
    const uniqueLocations = [
      ...new Set(filtered.map((tx) => tx.location).filter(Boolean)),
    ];
    setLocations(uniqueLocations);

    if (locationFilter && locationFilter !== "All") {
      filtered = filtered.filter((tx) => tx.location === locationFilter);
    }

    if (selectedDate) {
      const target = new Date(selectedDate).toDateString();
      filtered = filtered.filter(
        (tx) => new Date(tx.createdAt).toDateString() === target
      );
    }

    setTransactions(filtered);
  } catch (err) {
    console.error(err);
  }
}


  const toggleDetails = (id) => {
    setExpandedTxId(expandedTxId === id ? null : id);
  };

  const exportCSV = () => {
    const headers = [
      "Staff,Location,Device,Date,Customer,Discount,DiscountReason,Total,Tender,Change",
    ];
    const rows = transactions.map((tx) =>
      [
        tx.staff?.name || "N/A",
        tx.location,
        tx.device,
        new Date(tx.createdAt).toLocaleString(),
        tx.customerName || "N/A",
        tx.discount,
        tx.discountReason,
        tx.total,
        tx.tenderType,
        tx.change,
      ].join(",")
    );
    const csv = headers.concat(rows).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
    saveAs(blob, "transactions.csv");
  };

  const handlePrint = () => window.print();

  return (
    <Layout title="Completed Transactions">
      <div className="min-h-screen bg-gray-50 p-6 text-amber-900 font-sans">
        <h1 className="text-3xl font-bold mb-6">Completed Transactions</h1>

        <div className="flex flex-col lg:flex-row gap-6 mb-6">
          <div className="bg-white rounded border shadow w-fit p-4">
            <h2 className="text-sm font-semibold text-gray-700 mb-2">June 2025</h2>
            <div className="grid grid-cols-7 gap-1 text-sm text-center text-gray-600">
              {["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"].map((d) => (
                <div key={d} className="font-medium">{d}</div>
              ))}
              {Array.from({ length: 30 }, (_, i) => {
                const day = i + 1;
                const isToday = day === 30;
                return (
                  <button
                    key={day}
                    className={`rounded px-2 py-1 ${
                      isToday ? "bg-amber-500 text-white" : "hover:bg-amber-100"
                    }`}
                    onClick={() => setSelectedDate(`2025-06-${day.toString().padStart(2, "0")}`)}
                  >
                    {day}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="flex-1 space-y-4">
            <div className="flex gap-4 items-end">
              <div className="flex-1">
                <label className="block text-sm font-medium mb-1">Filter by Location</label>
               <select
  className="w-full border px-3 py-2 rounded"
  onChange={(e) => setLocationFilter(e.target.value)}
>
  <option value="All">All</option>
  {locations.map((loc) => (
    <option key={loc} value={loc}>
      {loc}
    </option>
  ))}
</select>

              </div>
              <button
                className="text-sm text-amber-600 hover:underline"
                onClick={() => {
                  setLocationFilter("");
                  setSelectedDate(null);
                }}
              >
              </button>
            </div>

            <div className="flex items-center gap-6 mt-2">
  <h2 className="text-sm text-gray-700 font-medium flex items-center gap-2">
    Export Options
  </h2>
  <div className="flex flex-wrap gap-3">
    <button
      onClick={exportCSV}
      className="bg-amber-500 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-amber-600 transition duration-150 shadow-sm"
    >
      Export to CSV
    </button>
    <button
      className="bg-white border border-amber-500 text-amber-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-amber-50 transition duration-150"
    >
      Export to Word
    </button>
    <button
      className="bg-white border border-amber-500 text-amber-600 px-4 py-1.5 rounded-md text-sm font-medium hover:bg-amber-50 transition duration-150"
    >
      Export to Excel
    </button>
    <button
      onClick={handlePrint}
      className="bg-green-600 text-white px-4 py-1.5 rounded-md text-sm font-medium hover:bg-green-700 transition duration-150 shadow-sm"
    >
      Print Page
    </button>
  </div>
</div>

          </div>
        </div>

        <div id="print-section" className="overflow-x-auto bg-white rounded shadow border">
          <table className="min-w-full text-sm">
            <thead className="bg-amber-100 text-amber-900">
              <tr>
                <th className="px-4 py-3 text-left">Staff</th>
                <th className="px-4 py-3 text-left">Location</th>
                <th className="px-4 py-3 text-left">Device</th>
                <th className="px-4 py-3 text-left">Date/Time</th>
                <th className="px-4 py-3 text-left">Customer & Type</th>
                <th className="px-4 py-3 text-left">Discount</th>
                <th className="px-4 py-3 text-left">Discount Reason</th>
                <th className="px-4 py-3 text-left">Total</th>
                <th className="px-4 py-3 text-left">Tender</th>
                <th className="px-4 py-3 text-left">Change</th>
                <th className="px-4 py-3 text-center">Items</th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <>
                  <tr key={tx._id} className="border-t hover:bg-amber-50">
                    <td className="px-4 py-2">{tx.staff?.name || "N/A"}</td>
                    <td className="px-4 py-2">{tx.location}</td>
                    <td className="px-4 py-2">{tx.device || "Till 1"}</td>
                    <td className="px-4 py-2">{new Date(tx.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-2">{tx.customerName || "N/A"}</td>
                    <td className="px-4 py-2">₦{tx.discount?.toFixed(2) || "0.00"}</td>
                    <td className="px-4 py-2">{tx.discountReason || "-"}</td>
                    <td className="px-4 py-2">₦{tx.total?.toFixed(2)}</td>
                    <td className="px-4 py-2">{tx.tenderType}</td>
                    <td className="px-4 py-2">₦{tx.change?.toFixed(2) || "0.00"}</td>
                    <td className="px-4 py-2 text-center">
                      <button
                        className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-xs font-semibold"
                        onClick={() => toggleDetails(tx._id)}
                      >
                        Show Items
                      </button>
                    </td>
                  </tr>
                  {expandedTxId === tx._id && (
                    <tr className="bg-gray-50">
                      <td colSpan={11} className="px-6 py-4">
                        <table className="w-full text-sm">
                          <thead className="bg-amber-100">
                            <tr>
                              <th className="px-3 py-2 text-left">Name</th>
                              <th className="px-3 py-2 text-right">Qty</th>
                              <th className="px-3 py-2 text-right">Price</th>
                              <th className="px-3 py-2 text-right">Total</th>
                              {showBarcode && <th className="px-3 py-2 text-right">Barcode</th>}
                            </tr>
                          </thead>
                          <tbody>
                            {tx.items?.map((item, idx) => (
                              <tr key={idx}>
                                <td className="px-3 py-1">{item.name}</td>
                                <td className="px-3 py-1 text-right">{item.qty}</td>
                                <td className="px-3 py-1 text-right">₦{item.salePriceIncTax?.toFixed(2)}</td>
                                <td className="px-3 py-1 text-right">₦{(item.qty * item.salePriceIncTax).toFixed(2)}</td>
                                {showBarcode && <td className="px-3 py-1 text-right">{item.barcode || "-"}</td>}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </td>
                    </tr>
                  )}
                </>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
