"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Search, Loader2 } from "lucide-react";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";
import { ProductImage } from "@/components/LazyImage";

// Custom debounce function
function debounce(func, wait) {
  let timeout;
  return (...args) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func.apply(this, args), wait);
  };
}

export default function Products() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [categoryMap, setCategoryMap] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);
  const [expandedRow, setExpandedRow] = useState(null);
  
  // Pagination state for server-side pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalProducts, setTotalProducts] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  
  const entriesPerPage = 20;
  const observerRef = useRef(null);
  const loadMoreRef = useRef(null);

  // Fetch products with server-side pagination
  const fetchProducts = useCallback(async (page = 1, search = "", append = false) => {
    try {
      if (append) {
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      const params = new URLSearchParams({
        page: page.toString(),
        limit: entriesPerPage.toString(),
      });
      
      if (search.trim()) {
        params.append("search", search.trim());
      }

      const res = await axios.get(`/api/products?${params.toString()}`);
      const data = res.data;
      
      const productsArray = Array.isArray(data) ? data : data?.data || [];
      const pagination = data?.pagination || {};
      
      if (append) {
        setProducts(prev => [...prev, ...productsArray]);
      } else {
        setProducts(productsArray);
      }
      
      setTotalPages(pagination.totalPages || 1);
      setTotalProducts(pagination.total || productsArray.length);
      setHasMore(page < (pagination.totalPages || 1));
      setCurrentPage(page);
    } catch (err) {
      console.error("Failed to fetch products:", err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [entriesPerPage]);

  // Initial load
  useEffect(() => {
    fetchProducts(1, searchTerm);
    
    // Fetch categories
    const fetchCategories = async () => {
      try {
        const res = await axios.get("/api/categories");
        setCategories(res.data || []);
        const map = (res.data || []).reduce((acc, c) => {
          acc[c._id] = c.name;
          return acc;
        }, {});
        setCategoryMap(map);
      } catch (err) {
        console.error("Failed to fetch categories:", err);
      }
    };
    fetchCategories();
  }, []);

  // Intersection Observer for infinite scroll
  useEffect(() => {
    if (loading || loadingMore) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore) {
          fetchProducts(currentPage + 1, searchTerm, true);
        }
      },
      { threshold: 0.1, rootMargin: "100px" }
    );

    if (loadMoreRef.current) {
      observer.observe(loadMoreRef.current);
    }

    observerRef.current = observer;

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [loading, loadingMore, hasMore, currentPage, searchTerm, fetchProducts]);

  // Debounced search with server-side filtering
  const debouncedSearch = useCallback(
    debounce((term) => {
      setCurrentPage(1);
      setProducts([]);
      fetchProducts(1, term);
    }, 400),
    [fetchProducts]
  );

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchTerm(value);
    debouncedSearch(value);
  };

  // Edit & update
  const handleEditClick = (index, product) => {
    setEditIndex(index);
    setEditableProduct({ ...product });
    setProperties(product.properties || []);
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableProduct({});
    setProperties([]);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditableProduct((prev) => {
      const newValue = type === "checkbox" ? checked : value;
      const updated = { ...prev, [name]: newValue };
      if (["costPrice", "margin", "taxRate"].includes(name)) {
        updated.salePriceIncTax = calculateSalePrice(
          parseFloat(updated.costPrice) || 0,
          parseFloat(updated.margin) || 0,
          parseFloat(updated.taxRate) || 0
        );
      }
      return updated;
    });
  };

  const handleCategoryChange = (value) => {
    setEditableProduct((prev) => ({ ...prev, category: value }));
  };

  const handleUpdateClick = async (_id) => {
    try {
      const updatedProduct = { ...editableProduct, properties };
      await axios.put("/api/products", { ...updatedProduct, _id });

      setProducts((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...updatedProduct } : p))
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Update failed:", err);
      alert("Failed to update product.");
    }
  };

  // Delete
  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;
    try {
      await axios.delete(`/api/products?id=${_id}`);
      setProducts((prev) => prev.filter((p) => p._id !== _id));
      setTotalProducts(prev => prev - 1);
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Failed to delete product.");
    }
  };

  // Properties inline edit
  const addProperty = () => setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  const removeProperty = (i) => setProperties((prev) => prev.filter((_, idx) => idx !== i));
  const handlePropertyChange = (i, key, value) =>
    setProperties((prev) => {
      const updated = [...prev];
      updated[i][key] = value;
      return updated;
    });

  const calculateSalePrice = (cost, margin, tax) =>
    (cost * (1 + margin / 100) * (1 + tax / 100)).toFixed(2);

  const formatCurrency = (num) => {
    if (!num && num !== 0) return "";
    return `₦${new Intl.NumberFormat("en-NG", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(num)}`;
  };

  return (
    <Layout>
      <div className="p-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <div>
            <h1 className="text-2xl font-bold text-amber-900">Manage Products</h1>
            <p className="text-sm text-gray-500">
              {loading ? "Loading..." : `${totalProducts.toLocaleString()} products`}
            </p>
          </div>
          <Link href="../products/new">
            <button className="mt-2 sm:mt-0 py-1.5 px-4 bg-amber-600 hover:bg-amber-700 text-white rounded-sm text-sm">
              Add Product
            </button>
          </Link>
        </div>

        {/* Search */}
        <div className="flex gap-2 mb-4">
          <div className="relative flex-1">
            <span className="absolute left-3 top-2.5 text-gray-400">
              <Search className="w-4 h-4" />
            </span>
            <input
              type="text"
              placeholder="Search products..."
              className="w-full border border-amber-300 py-1.5 pl-9 pr-4 rounded-sm text-sm"
              value={searchTerm}
              onChange={handleSearchChange}
            />
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto rounded-sm shadow-md border border-amber-200">
          <table className="min-w-full text-xs divide-y divide-amber-100">
            <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
              <tr>
                <th className="p-2"></th>
                <th className="p-2">Advanced</th>
                <th className="p-2">Name</th>
                <th className="p-2">Description</th>
                <th className="p-2">Cost</th>
                <th className="p-2">Tax %</th>
                <th className="p-2">Sale</th>
                <th className="p-2">Margin</th>
                <th className="p-2">Barcode</th>
                <th className="p-2">Qty</th>
                <th className="p-2">Properties</th>
                <th className="p-2">Category</th>
                <th className="p-2">Promo</th>
                <th className="p-2">Delete</th>
              </tr>
            </thead>

            <tbody className="bg-white divide-y divide-amber-100">
              {loading && products.length === 0 ? (
                <tr>
                  <td colSpan="13" className="p-8 text-center">
                    <Loader2 className="w-8 h-8 animate-spin mx-auto text-amber-500" />
                    <p className="mt-2 text-gray-500">Loading products...</p>
                  </td>
                </tr>
              ) : products.length === 0 ? (
                <tr>
                  <td colSpan="13" className="p-8 text-center text-gray-500">
                    No products found.
                  </td>
                </tr>
              ) : (
                products.map((p, idx) => (
                <tr
                  key={p._id}
                  className={`hover:bg-amber-50 cursor-pointer ${expandedRow === idx ? "bg-amber-50" : ""}`}
                  onClick={() => setExpandedRow(expandedRow === idx ? null : idx)}
                >
                  {/* Edit buttons */}
                  <td className="p-2">
                    {editIndex === idx ? (
                      <div className="flex flex-col gap-1">
                        <button
                          onClick={() => handleUpdateClick(p._id)}
                          className="w-16 py-0.5 px-2 bg-green-600 text-white hover:bg-green-700 text-xs"
                        >
                          Update
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="w-16 py-0.5 px-2 bg-red-600 text-white hover:bg-red-700 text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleEditClick(idx, p);
                        }}
                        className="py-1 px-3 border border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white text-xs"
                      >
                        Edit
                      </button>
                    )}
                  </td>

                  {/* Advanced */}
                  <td className="p-2">
                    <Link href={`/products/edit/${p._id}`}>
                      <button
                        onClick={(e) => e.stopPropagation()}
                        className="py-1 px-3 border border-amber-700 text-amber-800 bg-amber-50 hover:bg-amber-600 hover:text-white text-xs"
                      >
                        Advanced
                      </button>
                    </Link>
                  </td>

                  {/* Product Image & Name */}
                  <td className="p-2 font-semibold">
                    <div className="flex items-center gap-2">
                      <ProductImage images={p.images} alt={p.name} size="small" />
                      {editIndex === idx ? (
                        <input
                          name="name"
                          value={editableProduct.name || ""}
                          onChange={handleChange}
                          className="w-28 border p-1 rounded text-xs"
                        />
                      ) : (
                        <span className="truncate max-w-[120px]">{p.name}</span>
                      )}
                    </div>
                  </td>
                  <td className="p-2 max-w-[150px]">
                    {expandedRow === idx ? p.description : <span className="truncate block">{p.description}</span>}
                  </td>
                  <td className="p-2">{editIndex === idx ? <input name="costPrice" value={editableProduct.costPrice || ""} onChange={handleChange} type="number" className="w-20 border p-1 rounded text-xs"/> : formatCurrency(p.costPrice)}</td>
                  <td className="p-2">{editIndex === idx ? <input name="taxRate" value={editableProduct.taxRate || ""} onChange={handleChange} type="number" className="w-16 border p-1 rounded text-xs"/> : p.taxRate}</td>
                  <td className="p-2 text-green-700">{editIndex === idx ? <input name="salePriceIncTax" value={editableProduct.salePriceIncTax || ""} onChange={handleChange} type="number" className="w-20 border p-1 rounded text-xs"/> : formatCurrency(p.salePriceIncTax)}</td>
                  <td className="p-2">{editIndex === idx ? <input name="margin" value={editableProduct.margin || ""} onChange={handleChange} type="number" className="w-16 border p-1 rounded text-xs"/> : p.margin}</td>
                  <td className="p-2">{editIndex === idx ? <input name="barcode" value={editableProduct.barcode || ""} onChange={handleChange} className="w-24 border p-1 rounded text-xs"/> : p.barcode}</td>

                  {/* Quantity */}
                  <td className="p-2">{editIndex === idx ? <input name="quantity" value={editableProduct.quantity ?? ""} onChange={handleChange} type="number" className="w-16 border p-1 rounded text-xs"/> : (p.quantity ?? 0)}</td>

                  {/* Properties */}
                  <td className="p-2">
                    {editIndex === idx ? (
                      <div className="space-y-1">
                        {properties.map((prop, i) => (
                          <div key={i} className="flex items-center space-x-1">
                            <input
                              value={prop.propName}
                              onChange={(e) => handlePropertyChange(i, "propName", e.target.value)}
                              placeholder="Name"
                              className="w-20 border p-1 rounded text-xs"
                            />
                            <input
                              value={prop.propValue}
                              onChange={(e) => handlePropertyChange(i, "propValue", e.target.value)}
                              placeholder="Value"
                              className="w-20 border p-1 rounded text-xs"
                            />
                            <button
                              onClick={(e) => { e.stopPropagation(); removeProperty(i); }}
                              className="text-red-500 text-xs"
                            >
                              X
                            </button>
                          </div>
                        ))}
                        <button
                          onClick={(e) => { e.stopPropagation(); addProperty(); }}
                          className="text-blue-500 text-xs"
                        >
                          + Add
                        </button>
                      </div>
                    ) : p.properties?.length > 0 ? p.properties.map((pr) => `${pr.propName}: ${pr.propValue}`).join(", ") : "No Props"}
                  </td>

                  {/* Category */}
                  <td className="p-2">
                    {editIndex === idx ? (
                      <select value={editableProduct.category || ""} onChange={(e) => handleCategoryChange(e.target.value)} className="border p-1 rounded text-xs w-28">
                        <option value="">Top Level</option>
                        {categories.map((cat) => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                      </select>
                    ) : categoryMap[p.category] || "Top Level"}
                  </td>

                  {/* Promo */}
                  <td className="p-2">{p.isPromotion ? <span className="text-green-600 font-bold">Yes</span> : <span className="text-gray-400">No</span>}</td>

                  {/* Delete */}
                  <td className="p-2">
                    <button onClick={(e) => { e.stopPropagation(); handleDeleteClick(p._id); }} className="py-1 px-3 border border-red-700 text-red-800 bg-red-50 hover:bg-red-600 hover:text-white text-xs">X</button>
                  </td>
                </tr>
              ))
              )}
            </tbody>
          </table>
        </div>

        {/* Infinite Scroll Loader */}
        <div ref={loadMoreRef} className="flex justify-center items-center mt-6 py-4">
          {loadingMore && (
            <div className="flex items-center gap-2 text-amber-600">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span className="text-sm">Loading more products...</span>
            </div>
          )}
          {!loadingMore && hasMore && products.length > 0 && (
            <button
              onClick={() => fetchProducts(currentPage + 1, searchTerm, true)}
              className="px-4 py-2 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded-md text-sm transition"
            >
              Load More ({products.length} of {totalProducts})
            </button>
          )}
          {!hasMore && products.length > 0 && (
            <p className="text-gray-400 text-sm">All {totalProducts} products loaded</p>
          )}
        </div>
      </div>
    </Layout>
  );
}
