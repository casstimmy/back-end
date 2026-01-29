import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import { useUser } from "@/lib/useUser";

export default function StockMovementAdd() {
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [reasons] = useState(["Restock", "Transfer", "Return"]);

  const [fromLocation, setFromLocation] = useState("Vendor");
  const [toLocation, setToLocation] = useState("Online Store");
  const [staff, setStaff] = useState("");
  const [reason, setReason] = useState("Restock");
  const [defaultsSet, setDefaultsSet] = useState(false);

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInput, setQuantityInput] = useState("");
  const [addedProducts, setAddedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [showProducts, setShowProducts] = useState(false);
  const router = useRouter();
  const { user, loading: userLoading } = useUser();

  // Default location if none exist
  const DEFAULT_LOCATION = { _id: "default", name: "Online Store" };

  // Fetch setup and staff data on mount
  useEffect(() => {
    fetch("/api/setup")
      .then((res) => res.json())
      .then((data) => {
        // locations is at root level of setup, not under 'store'
        if (data?.locations && Array.isArray(data.locations) && data.locations.length > 0) {
          const locs = data.locations.map((loc, i) => ({
            _id: i.toString(),
            name: loc,
          }));
          setLocations(locs);
        } else {
          // No locations found - use default
          setLocations([DEFAULT_LOCATION]);
        }
      })
      .catch((err) => {
        console.error("Error fetching setup:", err);
        // On error, use default location
        setLocations([DEFAULT_LOCATION]);
      });

    fetch("/api/staff")
      .then((res) => res.json())
      .then((data) => {
        // Handle both array format and { staff: [...] } format
        const staffData = Array.isArray(data) ? data : data?.staff || [];
        setStaffList(staffData);
      })
      .catch((err) => {
        console.error("Error fetching staff:", err);
        setStaffList([]);
      });
  }, []);

  // Set default values when data is loaded
  useEffect(() => {
    // Only set defaults once
    if (defaultsSet) return;
    
    // Wait for locations to load
    if (locations.length === 0) return;

    // Set default location (first location) for all users
    if (!toLocation) {
      setToLocation(locations[0].name);
    }

    // Set default staff if staff list is loaded
    if (staffList.length > 0 && !staff) {
      if (user) {
        // Try to find the logged-in user in staffList
        const matchedStaff = staffList.find(
          (s) =>
            (s.name && user.username && s.name.toLowerCase() === user.username.toLowerCase()) ||
            (s.name && user.name && s.name.toLowerCase() === user.name.toLowerCase()) ||
            (s.email && user.email && s.email.toLowerCase() === user.email.toLowerCase())
        );
        setStaff(matchedStaff ? matchedStaff.name : staffList[0].name);
      } else {
        // No user logged in, just use first staff
        setStaff(staffList[0].name);
      }
    }

    setDefaultsSet(true);
  }, [user, locations, staffList, toLocation, staff, defaultsSet]);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) {
        setLoadingSearch(true);
        setShowProducts(true);
        fetch(`/api/products?search=${encodeURIComponent(trimmed)}`)
          .then((res) => res.json())
          .then((data) => {
            // Handle { success: true, data: [...] } or direct array format
            const productsData = Array.isArray(data) ? data : data?.data || [];
            setProducts(productsData);
          })
          .catch((err) => {
            console.error("Error searching products:", err);
            setProducts([]);
          })
          .finally(() => setLoadingSearch(false));
      } else {
        setProducts([]);
        setShowProducts(false);
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setProducts([]);
    setShowProducts(false);
  };

  const addProduct = () => {
    if (!selectedProduct) return;

    const qty = quantityInput === "" ? 1 : Math.max(1, parseInt(quantityInput) || 1);

    const existing = addedProducts.find((p) => p._id === selectedProduct._id);
    if (existing) {
      setAddedProducts((prev) =>
        prev.map((p) =>
          p._id === existing._id
            ? { ...p, quantity: p.quantity + qty }
            : p
        )
      );
    } else {
      setAddedProducts((prev) => [
        ...prev,
        { ...selectedProduct, quantity: qty },
      ]);
    }

    setSearchTerm("");
    setQuantityInput("");
    setSelectedProduct(null);
    setShowProducts(false);
  };

  const removeProduct = (id) => {
    setAddedProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const updateProductQuantity = (id, newQty) => {
    const qty = Math.max(1, parseInt(newQty) || 1);
    setAddedProducts((prev) =>
      prev.map((p) =>
        p._id === id ? { ...p, quantity: qty } : p
      )
    );
  };

  const handleAddToStock = async () => {
    if (
      !fromLocation ||
      !toLocation ||
      !staff ||
      !reason ||
      addedProducts.length === 0
    ) {
      alert("Please complete all fields and add at least one product.");
      return;
    }

    try {
      const totalCostPrice = addedProducts.reduce(
        (sum, p) => sum + p.costPrice * p.quantity,
        0
      );

      const transRef = Date.now().toString(); // Use timestamp or UUID

      const payload = {
        transRef,
        fromLocation,
        toLocation,
        staff,
        reason,
        status: "Received",
        totalCostPrice,
        barcode: transRef, // Optional: You can make barcode same as transRef
        dateSent: new Date().toISOString(),
        dateReceived: new Date().toISOString(),
        products: addedProducts.map((p) => ({
          id: p._id,
          quantity: p.quantity,
        })),
      };

      const res = await fetch("/api/stock-movement/stock-movement", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || "Stock update failed");

      router.push("/stock/movement");
    } catch (err) {
      console.error(err);
      alert("Error saving stock movement: " + err.message);
    }
  };

  const totalCost = addedProducts.reduce(
    (sum, p) => sum + p.costPrice * p.quantity,
    0
  );

  return (
    <Layout>
      <div className="p-8 bg-gray-50 min-h-screen space-y-6">
        <h1 className="text-2xl font-semibold text-gray-700">
          Stock Movement Add{" "}
          <span className="text-amber-500 text-sm">HELP</span>
        </h1>

        {/* Header Form */}
        <div className="grid md:grid-cols-2 gap-4 bg-white p-4 rounded shadow">
          <Dropdown
            label="Deliver stock from"
            value={fromLocation}
            onChange={setFromLocation}
            options={[{ _id: "vendor", name: "Vendor" }, ...locations]}
          />

          <Dropdown
            label="Deliver stock to"
            value={toLocation}
            onChange={setToLocation}
            options={locations}
          />
          <Dropdown
            label="Staff member"
            value={staff}
            onChange={setStaff}
            options={staffList}
          />
          <Dropdown
            label="Reason"
            value={reason}
            onChange={setReason}
            options={reasons.map((r) => ({ name: r, _id: r }))}
          />
        </div>

        {/* Product Search */}
        <div className="bg-white p-4 rounded shadow space-y-2">
          <div className="relative space-y-1">
            <label className="block text-sm text-gray-700">
              Product barcode or item search:
            </label>
            <input
              className="w-full border px-2 py-1"
              placeholder="Search product name or barcode..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProduct(null);
              }}
              onFocus={() => searchTerm.length >= 2 && setShowProducts(true)}
              onBlur={() => setTimeout(() => setShowProducts(false), 200)}
            />
            {loadingSearch && (
              <div className="absolute z-10 w-full bg-white border px-3 py-2 text-sm text-gray-400">
                Searching...
              </div>
            )}
            {!loadingSearch && showProducts && products.length > 0 && (
              <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-md">
                {products.map((product) => (
                  <li
                    key={product._id}
                    className="px-3 py-2 hover:bg-amber-100 cursor-pointer"
                    onClick={() => handleProductSelect(product)}
                  >
                    {product.name} — ₦{product.salePriceIncTax}
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              onClick={() => setQuantityInput((q) => Math.max(q - 1, 1))}
              className="bg-amber-100 text-lg w-8 h-8"
            >
              -
            </button>
            <input
              type="number"
              className="w-16 text-center border"
              min="1"
              placeholder="1"
              value={quantityInput}
              onChange={(e) => setQuantityInput(e.target.value)}
            />
            <button
              onClick={() => setQuantityInput((q) => q + 1)}
              className="bg-amber-100 text-lg w-8 h-8"
            >
              +
            </button>
            <button
              onClick={addProduct}
              disabled={!selectedProduct}
              className="ml-auto bg-sky-500 text-white px-4 py-2 text-sm rounded disabled:opacity-50"
            >
              INSERT
            </button>
          </div>
        </div>

        {/* Product Table */}
        <div className="bg-white rounded shadow overflow-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 text-left">PRODUCT</th>
                <th className="px-4 py-2">UNIT COST</th>
                <th className="px-4 py-2">UNIT SALE</th>
                <th className="px-4 py-2">QUANTITY</th>
                <th className="px-4 py-2">TOTAL COST</th>
                <th className="px-4 py-2">REMOVE</th>
              </tr>
            </thead>
            <tbody>
              {addedProducts.length === 0 ? (
                <tr>
                  <td
                    className="px-4 py-2 italic text-gray-500"
                    colSpan={6}
                  >
                    Scan or look up an item using the search box above
                  </td>
                </tr>
              ) : (
                addedProducts.map((p) => (
                  <tr key={p._id} className="border-t">
                    <td className="px-4 py-2">{p.name}</td>
                    <td className="px-4 py-2">₦{p.costPrice}</td>
                    <td className="px-4 py-2">₦{p.salePriceIncTax}</td>
                    <td className="px-4 py-2">
                      <input
                        type="number"
                        min="1"
                        value={p.quantity}
                        onChange={(e) => updateProductQuantity(p._id, e.target.value)}
                        className="w-16 text-center border rounded px-2 py-1"
                      />
                    </td>
                    <td className="px-4 py-2">
                      ₦{(p.quantity * p.costPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeProduct(p._id)}
                        className="text-amber-500 text-xs"
                      >
                        REMOVE
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Total Cost */}
        <div className="bg-white shadow rounded p-4 text-right font-semibold text-gray-700">
          Total Cost: ₦{totalCost.toLocaleString()}
        </div>

        {/* Actions */}
        <div className="flex justify-between">
          <button className="bg-sky-500 text-white px-4 py-2 rounded">
            STOCK REPORT
          </button>
          <button
            onClick={handleAddToStock}
            className="bg-green-500 text-white px-4 py-2 rounded disabled:opacity-50"
            disabled={
              !fromLocation ||
              !toLocation ||
              !staff ||
              !reason ||
              addedProducts.length === 0
            }
          >
            ADD TO STOCK
          </button>
        </div>
      </div>
    </Layout>
  );
}

function Dropdown({ label, value, onChange, options }) {
  // Ensure options is always an array
  const safeOptions = Array.isArray(options) ? options : [];
  
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <select
        className="w-full border px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">* Select {label}</option>
        {safeOptions.map((opt) => (
          <option key={opt._id || opt.name} value={opt.name}>
            {opt.name}
          </option>
        ))}
      </select>
    </div>
  );
}
