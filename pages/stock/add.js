import { useState, useEffect } from "react";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";

export default function StockMovementAdd() {
  const [locations, setLocations] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [reasons] = useState(["Restock", "Transfer", "Return"]);

  const [fromLocation, setFromLocation] = useState("");
  const [toLocation, setToLocation] = useState("");
  const [staff, setStaff] = useState("");
  const [reason, setReason] = useState("");

  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [quantityInput, setQuantityInput] = useState(1);
  const [addedProducts, setAddedProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const router = useRouter();

  useEffect(() => {
    fetch("/api/setup/get")
      .then((res) => res.json())
      .then((data) => {
        if (data?.store?.locations) {
          const locs = data.store.locations.map((loc, i) => ({
            _id: i.toString(),
            name: loc,
          }));
          setLocations(locs);
        }
      });

    fetch("/api/staff")
      .then((res) => res.json())
      .then(setStaffList);
  }, []);

  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      const trimmed = searchTerm.trim();
      if (trimmed.length >= 2) {
        setLoadingSearch(true);
        fetch(`/api/products?search=${encodeURIComponent(trimmed)}`)
          .then((res) => res.json())
          .then(setProducts)
          .catch(console.error)
          .finally(() => setLoadingSearch(false));
      } else {
        setProducts([]);
        setLoadingSearch(false);
      }
    }, 500);

    return () => clearTimeout(delayDebounce);
  }, [searchTerm]);

  const handleProductSelect = (product) => {
    setSelectedProduct(product);
    setSearchTerm(product.name);
    setProducts([]);
  };

  const addProduct = () => {
    if (!selectedProduct) return;

    const existing = addedProducts.find((p) => p._id === selectedProduct._id);
    if (existing) {
      setAddedProducts((prev) =>
        prev.map((p) =>
          p._id === existing._id
            ? { ...p, quantity: p.quantity + quantityInput }
            : p
        )
      );
    } else {
      setAddedProducts((prev) => [
        ...prev,
        { ...selectedProduct, quantity: quantityInput },
      ]);
    }

    setSearchTerm("");
    setQuantityInput(1);
    setSelectedProduct(null);
  };

  const removeProduct = (id) => {
    setAddedProducts((prev) => prev.filter((p) => p._id !== id));
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
          <span className="text-blue-500 text-sm">HELP</span>
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
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setSelectedProduct(null);
              }}
            />
            {loadingSearch && (
              <div className="absolute z-10 w-full bg-white border px-3 py-2 text-sm text-gray-400">
                Searching...
              </div>
            )}
            {!loadingSearch && products.length > 0 && (
              <ul className="absolute z-10 bg-white border w-full max-h-48 overflow-y-auto shadow-md">
                {products.map((product) => (
                  <li
                    key={product._id}
                    className="px-3 py-2 hover:bg-blue-100 cursor-pointer"
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
              className="bg-blue-100 text-lg w-8 h-8"
            >
              -
            </button>
            <input
              type="number"
              className="w-16 text-center border"
              value={quantityInput}
              onChange={(e) =>
                setQuantityInput(parseInt(e.target.value) || 1)
              }
            />
            <button
              onClick={() => setQuantityInput((q) => q + 1)}
              className="bg-blue-100 text-lg w-8 h-8"
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
                    <td className="px-4 py-2">{p.quantity}</td>
                    <td className="px-4 py-2">
                      ₦{(p.quantity * p.costPrice).toLocaleString()}
                    </td>
                    <td className="px-4 py-2">
                      <button
                        onClick={() => removeProduct(p._id)}
                        className="text-blue-500 text-xs"
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
  return (
    <div>
      <label className="text-sm text-gray-600">{label}</label>
      <select
        className="w-full border px-2 py-1"
        value={value}
        onChange={(e) => onChange(e.target.value)}
      >
        <option>* Select {label}</option>
        {options.map((opt) => (
          <option key={opt._id}>{opt.name}</option>
        ))}
      </select>
    </div>
  );
}
