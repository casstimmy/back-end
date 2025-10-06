import { useEffect, useState } from "react";
import {
  Chart as ChartJS,
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  LineController,
  Filler,
  ArcElement,
} from "chart.js";
import { Bar, Pie, Line } from "react-chartjs-2";
import Layout from "@/components/Layout";

ChartJS.register(
  BarElement,
  CategoryScale,
  LinearScale,
  Tooltip,
  Legend,
  PointElement,
  LineElement,
  LineController,
  Filler,
  ArcElement
);

export default function Reporting() {
  const [report, setReport] = useState(null);
  const [loading, setLoading] = useState(true); // Added loading state
  const [selectedLocation, setSelectedLocation] = useState("All");
  const [selectedDays, setSelectedDays] = useState(14);
  const [granularity, setGranularity] = useState("Day");

  const handleGranularityChange = (period) => {
    setGranularity(period);
    switch (period) {
      case "Month":
        setSelectedDays(180);
        break;
      case "Week":
        setSelectedDays(90);
        break;
      case "Day":
        setSelectedDays(30);
        break;
      case "Hourly":
        setSelectedDays(2);
        break;
    }
  };

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true);
        const query = new URLSearchParams({
          location: selectedLocation,
          days: selectedDays,
          period: granularity,
        });
        const res = await fetch(`/api/reporting/reporting-data?${query}`);
        const data = await res.json();
        setReport(data);
      } catch (err) {
        console.error("Failed to fetch report:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchData();
  }, [selectedLocation, selectedDays, granularity]);

  if (loading) {
    return (
      <Layout title="Reporting">
        <div className="flex justify-center items-center h-[70vh]">
          <div className="w-12 h-12 border-4 border-amber-500 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </Layout>
    );
  }

  if (!report) return null; // in case of error, show nothing

  const {
    dates = [],
    salesData = [],
    transactionQty = [],
    bestSellingProducts = [],
    salesByLocation = {},
    salesByTender = {},
    salesByEmployee = {},
    summary = {},
  } = report;

  const combinedLineData = {
    labels: dates,
    datasets: [
      {
        label: "Net Sales Inc. Tax",
        data: salesData,
        fill: true,
        backgroundColor: "rgba(59, 130, 246, 0.2)",
        borderColor: "rgba(59, 130, 246, 1)",
        tension: 0.3,
      },
      {
        label: "Transaction Qty",
        data: transactionQty,
        borderColor: "orange",
        backgroundColor: "orange",
        type: "line",
        yAxisID: "y1",
        tension: 0.3,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(salesByTender),
    datasets: [
      {
        data: Object.values(salesByTender),
        backgroundColor: ["#3b82f6", "#2563eb", "#60a5fa", "#f97316"],
      },
    ],
  };

  const locationBars = {
    labels: Object.keys(salesByLocation),
    datasets: [
      {
        label: "Transactions",
        data: Object.values(salesByLocation),
        backgroundColor: "#3b82f6",
      },
    ],
  };

  const employeeStacked = {
    labels: dates,
    datasets: Object.entries(salesByEmployee).map(([name, values], i) => ({
      label: name,
      data: values,
      fill: true,
      backgroundColor: `rgba(${80 + i * 30}, ${150 - i * 20}, 250, 0.5)`,
    })),
  };

  const bestSellers = {
    labels: bestSellingProducts.map((p) => p[0]),
    datasets: [
      {
        label: "Units",
        data: bestSellingProducts.map((p) => p[1]),
        backgroundColor: "#0ea5e9",
      },
    ],
  };

  const stockMargin = summary.stockMargin || summary.grossMargin || 0;
  const stockCost = (summary.totalSales || 0) - stockMargin;
  const averageTransaction =
    summary.totalSales && summary.totalTransactions
      ? summary.totalSales / summary.totalTransactions
      : 0;

  return (
    <Layout title="Reporting">
      <div className="p-4 space-y-6">
        {/* Filter Bar */}
        <div className="flex flex-wrap gap-4 items-center bg-white p-4 rounded shadow">
          <label>Location:</label>
          <select
            value={selectedLocation}
            onChange={(e) => setSelectedLocation(e.target.value)}
            className="border px-3 py-1"
          >
            {["All", ...Object.keys(salesByLocation || {})].map((loc) => (
              <option key={loc}>{loc}</option>
            ))}
          </select>

          <label className="ml-4">Last:</label>
          <input
            type="number"
            value={selectedDays}
            onChange={(e) => setSelectedDays(Number(e.target.value))}
            className="border px-2 w-20"
          />
          <span>days</span>

          <div className="ml-auto flex gap-2">
            {["Month", "Week", "Day", "Hourly"].map((period) => (
              <button
                key={period}
                onClick={() => handleGranularityChange(period)}
                className={`text-sm px-2 py-1 border rounded ${
                  granularity === period
                    ? "bg-amber-600 text-white"
                    : "text-amber-600 border-amber-600"
                }`}
              >
                {period}
              </button>
            ))}
          </div>
        </div>

        {/* Main Chart */}
        <div className="bg-white p-4 rounded shadow h-[300px] md:h-[350px] lg:h-[400px]">
          <Line
            data={combinedLineData}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  ticks: {
                    callback: (value) => `₦${value.toLocaleString()}`,
                  },
                },
                y1: {
                  position: "right",
                  beginAtZero: true,
                },
              },
            }}
          />
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card
            title="Total Sales"
            value={`₦${summary.totalSales?.toLocaleString()}`}
          />
          <Card title="Total Transactions" value={summary.totalTransactions || 0} />
          <Card title="Low Stock Items" value={summary.lowStockItems || 0} />
          <Card
            title="Operating Margin"
            value={`${summary.operatingMargin?.toFixed(2) || 0}%`}
          />
          <Card
            title="Total Cost"
            value={`₦${summary.totalCost?.toLocaleString() || 0}`}
          />
          <Card title="Gross Margin" value={`₦${stockMargin?.toLocaleString() || 0}`} />
          <Card
            title="Average Txn"
            value={`₦${averageTransaction.toLocaleString(undefined, {
              maximumFractionDigits: 2,
            })}`}
          />
        </div>

        {/* Lower Graphs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Sales by Tender</h3>
            <div className="w-[200px] h-[200px] mx-auto">
              <Pie data={pieData} options={{ maintainAspectRatio: false }} />
            </div>
          </div>

          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Transactions by Location</h3>
            <Bar data={locationBars} options={{ indexAxis: "y" }} />
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Best Sellers</h3>
            <Bar data={bestSellers} options={{ indexAxis: "y" }} />
          </div>
          <div className="bg-white p-4 rounded shadow">
            <h3 className="font-semibold mb-2">Sales by Employee</h3>
            <Bar
              data={employeeStacked}
              options={{
                responsive: true,
                plugins: { legend: { position: "bottom" } },
              }}
            />
          </div>
        </div>
      </div>
    </Layout>
  );
}

function Card({ title, value }) {
  return (
    <div className="bg-white p-4 rounded shadow text-center">
      <div className="text-sm text-gray-500 mb-1">{title}</div>
      <div className="text-xl font-bold text-amber-700">{value}</div>
    </div>
  );
}
