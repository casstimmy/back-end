import Layout from "@/components/Layout";
import { useState, useEffect, useCallback, useRef } from "react";
import { ProductImage } from "@/components/LazyImage";

export default function StockManagement() {
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [outgoingStock, setOutgoingStock] = useState(0);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [totalProducts, setTotalProducts] = useState(0);
  const loadMoreRef = useRef(null);

  // Filter states
  const [statusFilter, setStatusFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({}); // Map category ID to name

  // Fetch categories on mount
  useEffect(() => {
    async function fetchCategories() {
      try {
        const catRes = await fetch("/api/categories");
        if (catRes.ok) {
          const catData = await catRes.json();
          const cats = Array.isArray(catData) ? catData : catData?.categories || [];
          // Create mapping of ID to name
          const mapping = {};
          cats.forEach(c => {
            if (c._id) mapping[c._id] = c.name;
            if (c.name) mapping[c.name] = c.name; // Also map name to itself
          });
          setCategoryMap(mapping);
        }
      } catch (error) {
        console.error("Error fetching categories:", error);
      }
    }
    fetchCategories();
  }, []);

  // Helper to get category name from ID or return as-is
  const getCategoryName = useCallback((categoryIdOrName) => {
    if (!categoryIdOrName) return "Uncategorized";
    return categoryMap[categoryIdOrName] || categoryIdOrName;
  }, [categoryMap]);

  const fetchProducts = useCallback(async (page = 1, append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: "30",
      });
      
      if (searchTerm.trim()) {
        params.append("search", searchTerm.trim());
      }

      const prodRes = await fetch(`/api/products?${params.toString()}`);
      if (prodRes.ok) {
        const data = await prodRes.json();
        const productsData = Array.isArray(data) ? data : data?.data || [];
        const pagination = data?.pagination || {};
        
        if (append) {
          setProducts(prev => {
            const allProducts = [...prev, ...productsData];
            // Extract unique categories from all products
            const uniqueCategories = [...new Set(allProducts.map(p => p.category).filter(Boolean))];
            setCategories(uniqueCategories.sort());
            return allProducts;
          });
        } else {
          setProducts(productsData);
          // Extract unique categories from products
          const uniqueCategories = [...new Set(productsData.map(p => p.category).filter(Boolean))];
          setCategories(uniqueCategories.sort());
        }
        
        setTotalProducts(pagination.total || productsData.length);
        setHasMore(page < (pagination.totalPages || 1));
        setCurrentPage(page);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts(1);

    // Fetch orders to calculate outgoing stock (shipped orders)
    async function fetchOrders() {
      try {
        const orderRes = await fetch("/api/orders?limit=500");
        if (orderRes.ok) {
          const orderData = await orderRes.json();
          const orders = orderData?.orders || [];
          
          const shippedTotal = orders
            .filter((order) => order.status === "Shipped")
            .reduce((sum, order) => {
              const orderQty = (order.cartProducts || []).reduce(
                (qty, item) => qty + (item.quantity || 0),
                0
              );
              return sum + orderQty;
            }, 0);
          
          setOutgoingStock(shippedTotal);
        }
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    }
    fetchOrders();
  }, []);

  // Debounced search
  useEffect(() => {
    const timer = setTimeout(() => {
      setCurrentPage(1);
      setProducts([]);
      fetchProducts(1);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchTerm]);

  // Intersection Observer for lazy loading
  useEffect(() => {
    if (loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchProducts(currentPage + 1, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    return () => observer.disconnect();
  }, [loading, loadingMore, hasMore, currentPage, fetchProducts]);

  const getStockStatus = (product) => {
    if (product.quantity === 0) return "Out of Stock";
    if (product.quantity < (product.minStock || 10)) return "Low Stock";
    return "In Stock";
  };

  const filteredItems = products.filter((item) => {
    // Text search filter
    const matchesSearch =
      item.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.category?.toLowerCase().includes(searchTerm.toLowerCase());

    // Status filter
    const status = getStockStatus(item);
    const matchesStatus =
      statusFilter === "all" ||
      (statusFilter === "in-stock" && status === "In Stock") ||
      (statusFilter === "low-stock" && status === "Low Stock") ||
      (statusFilter === "out-of-stock" && status === "Out of Stock");

    // Category filter
    const matchesCategory =
      categoryFilter === "all" ||
      item.category?.toLowerCase() === categoryFilter.toLowerCase();

    return matchesSearch && matchesStatus && matchesCategory;
  });

  const totalStock = products.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const lowStockCount = products.filter((p) => p.quantity < (p.minStock || 10)).length;
  const outOfStockCount = products.filter((p) => p.quantity === 0).length;

  return (
    <Layout>
      <div className="min-h-screen bg-gray-50 p-8">
        <header className="mb-10">
          <h1 className="text-3xl text-amber-900 font-bold mb-2">Stock Management</h1>
          <p className="text-gray-600">Monitor all stock levels and alerts in real-time.</p>
        </header>

        <section className="grid grid-cols-1 sm:grid-cols-4 gap-6 mb-10">
          <StatCard label="Total Stock" value={`${totalStock.toLocaleString()} units`} />
          <StatCard label="Outgoing Stock (Shipped)" value={`${outgoingStock.toLocaleString()} units`} />
          <StatCard label="Low Stock Alerts" value={lowStockCount} highlight={lowStockCount > 0} color="yellow" />
          <StatCard label="Out of Stock" value={outOfStockCount} highlight={outOfStockCount > 0} color="red" />
        </section>

        {/* Filters */}
        <div className="mb-6 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px] max-w-md">
            <input
              type="text"
              placeholder="Search by product or category..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600"
            />
          </div>

          <div className="min-w-[150px]">
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
            >
              <option value="all">All Status</option>
              <option value="in-stock">In Stock</option>
              <option value="low-stock">Low Stock</option>
              <option value="out-of-stock">Out of Stock</option>
            </select>
          </div>

          <div className="min-w-[150px]">
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-4 py-2 border rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-amber-600 bg-white"
            >
              <option value="all">All Categories</option>
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {getCategoryName(cat)}
                </option>
              ))}
            </select>
          </div>

          {(statusFilter !== "all" || categoryFilter !== "all" || searchTerm) && (
            <button
              onClick={() => {
                setStatusFilter("all");
                setCategoryFilter("all");
                setSearchTerm("");
              }}
              className="px-4 py-2 bg-gray-200 hover:bg-gray-300 rounded text-gray-700 transition"
            >
              Clear Filters
            </button>
          )}
        </div>

        {/* Results count */}
        <div className="mb-4 text-sm text-gray-600">
          Showing {filteredItems.length} of {products.length} products
        </div>

        <section className="overflow-x-auto bg-white rounded-lg shadow">
          {loading && products.length === 0 ? (
            <div className="flex justify-center items-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-amber-600"></div>
              <span className="ml-3 text-gray-600">Loading products...</span>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-100">
                <tr>
                  {["Image", "Name", "Category", "Stock Qty", "Unit Cost", "Status"].map((header) => (
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
                    const status = getStockStatus(product);

                    return (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <ProductImage
                            images={product.images}
                            alt={product.name}
                            size="small"
                          />
                        </td>
                        <td className="px-6 py-4">{product.name}</td>
                        <td className="px-6 py-4">{getCategoryName(product.category)}</td>
                        <td className="px-6 py-4">{(product.quantity ?? 0).toLocaleString()}</td>
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
          )}

          {/* Infinite scroll trigger */}
          <div ref={loadMoreRef} className="py-4">
            {loadingMore && (
              <div className="flex justify-center items-center py-4">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-amber-600"></div>
                <span className="ml-2 text-gray-600">Loading more...</span>
              </div>
            )}
            {!hasMore && products.length > 0 && (
              <p className="text-center text-gray-500 py-2">
                Showing all {totalProducts.toLocaleString()} products
              </p>
            )}
          </div>
        </section>
      </div>
    </Layout>
  );
}

function StatCard({ label, value, highlight = false, color = "yellow" }) {
  const borderColor = color === "red" ? "border-red-400" : "border-yellow-400";
  return (
    <div
      className={`bg-white rounded-lg shadow p-6 flex flex-col items-center ${
        highlight ? `border-2 ${borderColor}` : ""
      }`}
    >
      <p className="text-sm text-gray-500">{label}</p>
      <p className="mt-2 text-3xl font-bold text-gray-900">{value}</p>
    </div>
  );
}
