import { useEffect, useState } from "react";
import axios from "axios";
import { Search } from "lucide-react";

export default function PromotionManagement() {
  const [promotions, setPromotions] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editablePromotion, setEditablePromotion] = useState({});

  // Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [promoPrice, setPromoPrice] = useState("");

  // Fetch promotions
  const fetchPromotions = async () => {
    try {
      const res = await axios.get("/api/products");
      const promoProducts = (Array.isArray(res.data) ? res.data : res.data?.data || [])
        .filter((p) => p.isPromotion === true);
      setPromotions(promoProducts);
    } catch (err) {
      console.error("Error fetching promotions:", err);
    }
  };

  useEffect(() => {
    fetchPromotions();
  }, []);

  // Fetch all products for modal
  const fetchProducts = async () => {
    try {
      const res = await axios.get("/api/products");
      setAllProducts(Array.isArray(res.data) ? res.data : res.data?.data || []);
    } catch (err) {
      console.error("Error fetching products:", err);
    }
  };

  const handleSearch = () => {
    const filtered = promotions.filter((p) =>
      p.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setPromotions(filtered);
  };

  const handleEditClick = (index, promo) => {
    setEditIndex(index);
    setEditablePromotion({ ...promo });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditablePromotion((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateClick = async (_id) => {
    try {
      await axios.put("/api/products", { ...editablePromotion, _id });
      setPromotions((prev) =>
        prev.map((p) => (p._id === _id ? { ...p, ...editablePromotion } : p))
      );
      setEditIndex(null);
    } catch (err) {
      console.error("Failed to update promotion:", err);
      alert("Error updating promotion!");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditablePromotion({});
  };

  const handleDeleteClick = async (_id) => {
    if (!window.confirm("Remove promotion from this product?")) return;
    try {
      await axios.put("/api/products", { _id, isPromotion: false, promoPrice: null });
      setPromotions((prev) => prev.filter((p) => p._id !== _id));
    } catch (err) {
      console.error("Failed to remove promotion:", err);
    }
  };

  // Add promotion modal actions
  const openModal = () => {
    fetchProducts();
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setSelectedProduct(null);
    setPromoPrice("");
    setIsModalOpen(false);
  };

  const handleSavePromotion = async () => {
    if (!selectedProduct || !promoPrice) {
      alert("Please select a product and enter a promo price");
      return;
    }
    try {
      await axios.put("/api/products", {
        _id: selectedProduct._id,
        isPromotion: true,
        promoPrice: Number(promoPrice),
      });
      fetchPromotions();
      closeModal();
    } catch (err) {
      console.error("Error saving promotion:", err);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="w-full border-b p-4 shadow-md">
<div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 gap-2 sm:gap-0">
  <h2 className="text-xl sm:text-2xl font-bold text-amber-900">
    Promotion Management
  </h2>
  <button
    onClick={openModal}
    className="py-2 px-4 sm:px-6 bg-amber-600 text-white rounded-sm w-full sm:w-auto"
  >
    + Add Promotion product
  </button>
</div>


        {/* Search */}
        <div className="flex flex-col w-full gap-6 sm:flex-row items-center justify-between mb-4">
          <div className="w-full relative">
            <span className="absolute left-3 top-3.5 text-gray-400">
              <Search className="w-5 h-5" />
            </span>
            <input
              type="text"
              placeholder="Search promotions..."
              className="border border-amber-300 w-full py-2 pl-10 pr-4 rounded-sm"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button
            onClick={handleSearch}
            className="py-2 px-6 bg-amber-600 text-white rounded-sm"
          >
            Search
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="mt-8 w-full overflow-x-auto">
        <table className="min-w-full border border-amber-100 shadow-xl rounded-sm overflow-hidden">
          <thead className="bg-gradient-to-r from-amber-500 to-amber-600 text-white">
            <tr>
              <th className="p-4">Product</th>
              <th className="p-4">Promo Price</th>
              <th className="p-4">Active</th>
              <th className="p-4">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amber-100 bg-white">
            {promotions.length > 0 ? (
              promotions.map((promo, index) => (
                <tr key={promo._id}>
                  {/* Product Name */}
                  <td className="p-4 font-semibold">{promo.name}</td>

                  {/* Promo Price */}
                  <td className="p-4">
                    {editIndex === index ? (
                      <input
                        name="promoPrice"
                        value={editablePromotion.promoPrice || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-32 border p-2 rounded-md"
                      />
                    ) : (
                      `₦${promo.promoPrice || "-"}`
                    )}
                  </td>

                  {/* Active */}
                  <td className="p-4">
                    <span className="text-green-600 font-bold">Yes</span>
                  </td>

                  {/* Actions */}
                  <td className="p-4 flex gap-2">
                    {editIndex === index ? (
                      <>
                        <button
                          onClick={() => handleUpdateClick(promo._id)}
                          className="py-1 px-4 rounded bg-green-600 text-white hover:bg-green-700"
                        >
                          Save
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="py-1 px-4 rounded bg-gray-500 text-white hover:bg-gray-600"
                        >
                          Cancel
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => handleEditClick(index, promo)}
                          className="py-1 px-4 rounded border border-amber-500 text-amber-700 hover:bg-amber-500 hover:text-white"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteClick(promo._id)}
                          className="py-1 px-4 rounded bg-red-600 text-white hover:bg-red-700"
                        >
                          Remove
                        </button>
                      </>
                    )}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="4" className="p-4 text-center text-gray-500">
                  No active promotions found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

     {/* Modal */}
{isModalOpen && (
  <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
    <div className="bg-white p-6 rounded-lg shadow-lg w-full max-w-md sm:max-w-lg max-h-[80vh] overflow-y-auto">
      <h3 className="text-xl font-semibold mb-4">Add Promotion</h3>

      {/* Product List */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Select Product</label>
        <select
          className="border w-full p-2 rounded-md"
          value={selectedProduct?._id || ""}
          onChange={(e) => {
            const prod = allProducts.find((p) => p._id === e.target.value);
            setSelectedProduct(prod);
          }}
        >
          <option value="">-- Choose Product --</option>
          {allProducts.map((prod) => (
            <option key={prod._id} value={prod._id}>
              {prod.name} (₦{prod.salePriceIncTax})
            </option>
          ))}
        </select>
      </div>

      {/* Promo Price */}
      <div className="mb-4">
        <label className="block mb-2 font-medium">Promo Price</label>
        <input
          type="number"
          className="border w-full p-2 rounded-md"
          value={promoPrice}
          onChange={(e) => setPromoPrice(e.target.value)}
        />
      </div>

      {/* Actions */}
      <div className="flex flex-col sm:flex-row justify-end gap-2">
        <button
          onClick={closeModal}
          className="py-2 px-4 rounded bg-gray-500 text-white hover:bg-gray-600"
        >
          Cancel
        </button>
        <button
          onClick={handleSavePromotion}
          className="py-2 px-4 rounded bg-amber-600 text-white hover:bg-amber-700"
        >
          Save Promotion
        </button>
      </div>
    </div>
  </div>
)}

    </div>
  );
}
