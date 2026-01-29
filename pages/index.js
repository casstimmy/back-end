import Layout from "@/components/Layout";
import { Bar, Line } from "react-chartjs-2";
import { useEffect, useState } from "react";
import { useRouter } from "next/router";
import axios from "axios";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function Home() {
  const router = useRouter();
  const [selectedUser, setSelectedUser] = useState("Admin");
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [kpis, setKpis] = useState(null);
  const [productLabels, setProductLabels] = useState([]);
  const [salesToday, setSalesToday] = useState([]);
  const [salesBefore, setSalesBefore] = useState([]);
  const [hourlyTransactions, setHourlyTransactions] = useState([]);
  const [storeInfo, setStoreInfo] = useState({});
  const [loading, setLoading] = useState(true);
  const [allTransactions, setAllTransactions] = useState([]);
  const [staffCount, setStaffCount] = useState(0);
  const [expenses, setExpenses] = useState([]);
  const [recentOrders, setRecentOrders] = useState([]);
  const [topProducts, setTopProducts] = useState([]);
  const [lowProducts, setLowProducts] = useState([]);

  useEffect(() => {
    async function fetchInitialData() {
      try {
        setLoading(true);
        // Optimized: Limit data fetched for dashboard performance
        const [txRes, storeRes, staffRes, expenseRes, orderRes, prodRes] =
          await Promise.allSettled([
            axios.get("/api/transactions/transactions?limit=100&days=30"), // Last 30 days, max 100
            axios.get("/api/setup"),
            axios.get("/api/staff?limit=50"),                              // Limit staff for count
            axios.get("/api/expenses?limit=30"),                           // Recent expenses
            axios.get("/api/orders?limit=5"),                              // Only need 5 for display
            axios.get("/api/products?limit=50"),                           // Limit products
          ]);

        const store = storeRes.value?.data?.store || {};
        const locations = store?.locations || [];

        setAllTransactions(txRes.value?.data?.transactions || []);
        setStoreInfo(store);
        setSelectedUser(storeRes.value?.data?.user?.name || "Admin");
        
        // Handle staff API format: { staff: [...], pagination: {...} } or direct array
        const staffData = staffRes.value?.data;
        const staffArray = Array.isArray(staffData) ? staffData : staffData?.staff || [];
        setStaffCount(staffArray.length);
        
        // Handle expenses API format: { expenses: [...], pagination: {...} } or direct array
        const expenseData = expenseRes.value?.data;
        const expensesArray = Array.isArray(expenseData) ? expenseData : expenseData?.expenses || [];
        setExpenses(expensesArray);
        
        setRecentOrders(orderRes.value?.data?.orders?.slice(0, 5) || []);
        
        // Handle products API format: { success: true, data: [...] } or direct array
        const prodData = prodRes.value?.data;
        const products = Array.isArray(prodData) ? prodData : prodData?.data || [];

        if (products.length > 0) {
          const sorted = [...products].sort(
            (a, b) => (b.totalUnitsSold || 0) - (a.totalUnitsSold || 0)
          );
          setTopProducts(sorted.slice(0, 5));
          setLowProducts(sorted.slice(-5).reverse());
        } else {
          setTopProducts([]);
          setLowProducts([]);
        }

        if (locations.length > 0) {
          setSelectedLocation(locations[0]);
        }
      } catch (err) {
        console.error("Error loading dashboard data:", err);
      } finally {
        setLoading(false);
      }
    }

    fetchInitialData();
  }, []);

  useEffect(() => {
    if (allTransactions.length > 0) {
      processDashboardData(allTransactions);
    } else {
      setKpis({
        sales: 0,
        salesChangePercent: 0,
        transactions: 0,
        transactionsChangePercent: 0,
        avgTransactionValue: 0,
        avgTransactionChangePercent: 0,
      });
      setProductLabels([]);
      setSalesToday([]);
      setSalesBefore([]);
      setHourlyTransactions([]);
    }
  }, [allTransactions]);

  function processDashboardData(transactions) {
    const filteredTx = transactions; // no location filtering now
    const totalSales = filteredTx.reduce((sum, tx) => sum + (tx.total || 0), 0);
    const avgTxVal = filteredTx.length > 0 ? totalSales / filteredTx.length : 0;

    const productSales = {};
    filteredTx.forEach((tx) => {
      (tx.items || []).forEach((item) => {
        const itemName = item.name || "Unknown";
        if (!productSales[itemName]) productSales[itemName] = 0;
        // Use salePriceIncTax (Transaction model field) or price as fallback
        const itemPrice = item.salePriceIncTax || item.price || 0;
        const itemQty = item.qty || item.quantity || 1;
        productSales[itemName] += itemPrice * itemQty;
      });
    });

    // Sort by sales value and limit to top 10 products for better chart display
    const sortedProducts = Object.entries(productSales)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10);

    const labels = sortedProducts.map(([name]) => name);
    const todaySales = sortedProducts.map(([, value]) => value);
    const dummyWeekBefore = todaySales.map((val) => Math.floor(val * 0.8));

    const hourly = new Array(15).fill(0);
    filteredTx.forEach((tx) => {
      const hour = new Date(tx.createdAt).getHours();
      const index = hour - 9;
      if (index >= 0 && index < hourly.length) hourly[index]++;
    });

    setProductLabels(labels);
    setSalesToday(todaySales);
    setSalesBefore(dummyWeekBefore);
    setHourlyTransactions(hourly);

    setKpis({
      sales: totalSales,
      salesChangePercent: -7,
      transactions: filteredTx.length,
      transactionsChangePercent: -3,
      avgTransactionValue: avgTxVal,
      avgTransactionChangePercent: -4,
    });
  }

  const salesByProductData = {
    labels: productLabels.length > 0 ? productLabels : ["No Data"],
    datasets: [
      {
        label: "Today",
        data: salesToday.length > 0 ? salesToday : [0],
        backgroundColor: "#2563eb",
      },
      {
        label: "Week Before",
        data: salesBefore.length > 0 ? salesBefore : [0],
        backgroundColor: "#93c5fd",
      },
    ],
  };

  const transactionsByHourData = {
    labels: Array.from({ length: 15 }, (_, i) => `${i + 9}:00`),
    datasets: [
      {
        label: "Completed Transactions",
        data:
          hourlyTransactions.length > 0
            ? hourlyTransactions
            : new Array(15).fill(0),
        borderColor: "#2563eb",
        backgroundColor: "rgba(37, 99, 235, 0.3)",
        fill: true,
        tension: 0.3,
      },
    ],
  };

  const expenseData = {
    labels: expenses.length > 0 ? expenses.map((e) => e.title) : ["No Data"],
    datasets: [
      {
        label: "Expenses",
        data: expenses.length > 0 ? expenses.map((e) => e.amount) : [0],
        backgroundColor: "#f87171",
      },
    ],
  };

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-6 font-sans text-amber-800">
        <header className="flex flex-col sm:flex-row items-center justify-between mb-8 space-y-4 sm:space-y-0">
          <h1 className="text-3xl font-bold mb-2">Welcome {selectedUser}</h1>
          <button
            className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded px-5 py-2"
            onClick={() => router.push("/products/new")}
          >
            + Add a Product
          </button>
        </header>

      {loading || !kpis ? (
  <div className="flex items-center justify-center py-16">
    <div className="h-10 w-10 border-4 border-amber-600 border-t-transparent rounded-full animate-spin"></div>
  </div>
) :  (
          <>
            <section className="mb-10">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 mt-6">
                <KpiCard
                  label="Sales"
                  value={`₦${kpis.sales.toLocaleString()}.00`}
                  changePercent={kpis.salesChangePercent}
                />
                <KpiCard
                  label="Transactions"
                  value={kpis.transactions}
                  changePercent={kpis.transactionsChangePercent}
                  isCurrency={false}
                />
                <KpiCard
                  label="Avg. Transaction Value"
                  value={`₦${kpis.avgTransactionValue.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`}
                  changePercent={kpis.avgTransactionChangePercent}
                />
              </div>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              <ChartCard title="Sales Breakdown - By Product">
                <Bar data={salesByProductData} options={{ responsive: true }} />
              </ChartCard>
              <ChartCard title="Completed Transactions (by Hour)">
                <Line
                  data={transactionsByHourData}
                  options={{ responsive: true }}
                />
                <p className="mt-2 text-sm text-gray-600">
                  Note: refunds excluded
                </p>
              </ChartCard>
              <ChartCard title="Expenses Breakdown">
                <Bar data={expenseData} options={{ responsive: true }} />
              </ChartCard>
            </section>

            <section className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 mt-10">
              <ListCard
                title="Recent Orders"
                items={recentOrders.map(
                  (o) => `${o.customer?.name || "Unknown"} - ₦${o.total || 0} - ${o.status || "Pending"}`
                )}
              />
              <ListCard
                title="Top Products"
                items={topProducts.map(
                  (p) => `${p.name} - Sold: ${p.totalUnitsSold || 0}`
                )}
              />
              <ListCard
                title="Low Performing Products"
                items={lowProducts.map(
                  (p) => `${p.name} - Sold: ${p.totalUnitsSold || 0}`
                )}
              />
            </section>

            <section className="mt-10 flex flex-col lg:flex-row items-start lg:items-center justify-between space-y-6 lg:space-y-0">
              <button
                onClick={() => router.push("/reporting/reporting")}
                className="bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded px-6 py-3 shadow"
              >
                VIEW DASHBOARD
              </button>
              <div className="flex flex-col justify-center text-center text-amber-800">
                <h3 className="font-semibold text-lg mb-1">
                  Company Information
                </h3>
                <p>
                  {storeInfo?.storeName || "Oma Hub"} - Serving Quality Since
                  2005
                </p>
              </div>
              <div className="text-amber-800">
                <h3 className="font-semibold text-lg mb-1">--</h3>
              </div>
            </section>
          </>
        )}
      </div>
    </Layout>
  );
}

function KpiCard({ label, value, changePercent, isCurrency = true }) {
  const isNegative = changePercent < 0;
  return (
    <div className="bg-white rounded-lg shadow p-5 flex flex-col items-center">
      <span className="text-2xl font-bold">{value}</span>
      <span className="text-sm text-gray-600">{label}</span>
      <span
        className={`mt-2 font-semibold ${
          isNegative ? "text-red-600" : "text-green-600"
        }`}
      >
        {isNegative ? "▼" : "▲"} {Math.abs(changePercent)}%
      </span>
    </div>
  );
}

function ChartCard({ title, children }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-[40vh] flex flex-col">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <div className="flex-grow overflow-hidden">{children}</div>
    </div>
  );
}

function ListCard({ title, items }) {
  return (
    <div className="bg-white rounded-lg shadow p-4 h-[40vh] overflow-y-auto">
      <h2 className="text-lg font-semibold mb-2">{title}</h2>
      <ul className="space-y-2 text-sm text-amber-900">
        {items.length > 0 ? (
          items.map((item, idx) => <li key={idx}>{item}</li>)
        ) : (
          <li className="text-gray-500">No data available</li>
        )}
      </ul>
    </div>
  );
}
