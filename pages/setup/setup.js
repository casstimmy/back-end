import { useState, useEffect } from "react";
import Layout from "@/components/Layout";

export default function Setup() {
  const [storeName, setStoreName] = useState("");
  const [storePhone, setStorePhone] = useState("");
  const [country, setCountry] = useState("");
  const [locations, setLocations] = useState([]);
  const [locationInput, setLocationInput] = useState("");
  const [featuredProductId, setFeaturedProductId] = useState("");
  const [adminName, setAdminName] = useState("");
  const [adminEmail, setAdminEmail] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [products, setProducts] = useState([]);

  useEffect(() => {
    async function fetchData() {
      const res = await fetch("/api/setup/get");
      if (res.ok) {
        const { store, user } = await res.json();
        if (store) {
          setStoreName(store.storeName || "");
          setStorePhone(store.storePhone || "");
          setCountry(store.country || "");
          setLocations(store.locations || []);
          setFeaturedProductId(store.featuredProductId || "");
        }
        if (user) {
          setAdminName(user.name || "");
          setAdminEmail(user.email || "");
        }
      }
    }

    async function fetchProducts() {
      const res = await fetch("/api/products");
      if (res.ok) {
        const data = await res.json();
        setProducts(data);
      }
    }

    fetchData();
    fetchProducts();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const res = await fetch("/api/setup/setup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        storeName,
        storePhone,
        country,
        locations,
        featuredProductId,
        adminName,
        adminEmail,
        adminPassword,
      }),
    });

    if (res.ok) {
      alert("Store setup saved successfully.");
    } else {
      alert("Setup failed. Please try again.");
    }
  };

  const addLocation = () => {
    const loc = locationInput.trim();
    if (loc && !locations.includes(loc)) {
      setLocations([...locations, loc]);
      setLocationInput("");
    }
  };

  const removeLocation = (loc) => {
    setLocations(locations.filter((l) => l !== loc));
  };

  const Field = ({ label, ...props }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1">
        {label}
      </label>
      <input
        {...props}
        className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
      />
    </div>
  );

  return (
    <Layout>
  <div className="h-[100vh] flex items-start justify-center py-8 px-4 overflow-hidden">
    <div className="w-full max-w-6xl grid md:grid-cols-2 gap-10">
      
      {/* Configuration Summary */}
      <div className="h-[80vh] rounded-3xl bg-white shadow-xl border border-gray-200 p-8 overflow-y-auto">
  <h2 className="text-3xl font-semibold text-gray-800 border-b border-gray-100 pb-4 mb-6">
    Store Configuration Summary
  </h2>

  <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-6 text-sm text-gray-700">
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Store Name</p>
      <p className="text-base font-semibold">{storeName || "—"}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Phone</p>
      <p className="text-base font-semibold">{storePhone || "—"}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Country</p>
      <p className="text-base font-semibold">{country || "—"}</p>
    </div>
    <div>
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Featured Product</p>
      <p className="text-base font-semibold">
        {products.find((p) => p._id === featuredProductId)?.name || "—"}
      </p>
    </div>
    <div className="sm:col-span-2">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Store Locations</p>
      <div className="flex flex-wrap gap-2 mt-1">
        {locations.length > 0 ? (
          locations.map((loc, i) => (
            <span
              key={i}
              className="bg-blue-100 text-blue-800 text-xs font-medium px-3 py-1 rounded-full"
            >
              {loc}
            </span>
          ))
        ) : (
          <span className="text-gray-400 italic">—</span>
        )}
      </div>
    </div>
    <div className="sm:col-span-2">
      <p className="text-xs uppercase tracking-wide text-gray-500 mb-1">Admin</p>
      <p className="text-base font-semibold">
        {adminName || "—"} {adminEmail && `(${adminEmail})`}
      </p>
    </div>
  </div>
</div>


      {/* Setup Form */}
      <div className="h-[80vh] bg-white border rounded-2xl shadow-md p-6 flex flex-col justify-between overflow-y-auto">
        <h1 className="text-2xl font-semibold text-gray-800 mb-6">
          Update Store Configuration
        </h1>
        <form onSubmit={handleSubmit} className="space-y-3">
          <Field label="Store Name" value={storeName} onChange={(e) => setStoreName(e.target.value)} />
          <Field label="Store Phone" value={storePhone} onChange={(e) => setStorePhone(e.target.value)} />
          <Field label="Country" value={country} onChange={(e) => setCountry(e.target.value)} />

          {/* Featured Product */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Featured Product
            </label>
            <select
              value={featuredProductId}
              onChange={(e) => setFeaturedProductId(e.target.value)}
              className="w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">-- Select a Product --</option>
              {products.map((p) => (
                <option key={p._id} value={p._id}>{p.name}</option>
              ))}
            </select>
          </div>

          {/* Locations */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Store Locations
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Add Location"
                value={locationInput}
                onChange={(e) => setLocationInput(e.target.value)}
                className="flex-1 p-2 border rounded"
              />
              <button
                type="button"
                onClick={addLocation}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 transition"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-2 mt-2">
              {locations.map((loc, i) => (
                <span key={i} className="bg-gray-100 px-3 py-1 rounded-full text-sm flex items-center gap-2">
                  {loc}
                  <button
                    onClick={() => removeLocation(loc)}
                    className="text-red-500 hover:text-red-700"
                    title="Remove"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>

          <hr className="my-4" />

          {/* Admin Info */}
          <Field label="Admin Name" value={adminName} onChange={(e) => setAdminName(e.target.value)} />
          <Field label="Admin Email" type="email" value={adminEmail} onChange={(e) => setAdminEmail(e.target.value)} />
          <Field label="New Admin Password" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} />

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition"
          >
            Save Setup
          </button>
        </form>
      </div>
    </div>
  </div>
</Layout>

  );
}
