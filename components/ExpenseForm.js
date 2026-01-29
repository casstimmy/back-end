import { useEffect, useState } from "react";
import { Loader2, PlusCircle } from "lucide-react";

export default function ExpenseForm({ onSaved }) {
  const [formData, setFormData] = useState({
    title: "",
    amount: "",
    category: "",
    description: "",
    location: "",
  });

  const [customCategory, setCustomCategory] = useState("");
  const [categories, setCategories] = useState([]);
  const [isOtherCategory, setIsOtherCategory] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function fetchCategories() {
      const res = await fetch("/api/expenses/expense-category");
      const data = await res.json();
      setCategories(data);
    }
    fetchCategories();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    if (name === "category") {
      setIsOtherCategory(value === "Other");
      if (value !== "Other") setCustomCategory("");
    }

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    let categoryToSave = formData.category;

    // If "Other" was selected, create the custom category first
    if (isOtherCategory && customCategory) {
      const res = await fetch("/api/expenses/expense-category", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: customCategory }),
      });

      if (res.ok) {
        const updatedCats = await res.json();
        setCategories(updatedCats);
        const newCat = updatedCats.find((cat) => cat.name === customCategory)?._id;

        if (newCat) {
          categoryToSave = newCat;
        } else {
          alert("Failed to find new category after creation");
          setLoading(false);
          return;
        }
      } else {
        alert("Failed to create custom category");
        setLoading(false);
        return;
      }
    }

    const res = await fetch("/api/expenses", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        title: formData.title,
        amount: formData.amount,
        category: categoryToSave,
        description: formData.description,
        location: formData.location || null,
      }),
    });

    if (res.ok) {
      setFormData({ title: "", amount: "", category: "", description: "", location: "" });
      setCustomCategory("");
      setIsOtherCategory(false);
      onSaved && onSaved();
    } else {
      alert("Failed to save expense");
    }

    setLoading(false);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white p-6 rounded-xl shadow-md space-y-5 border border-gray-200"
    >
      <h2 className="text-xl font-semibold text-gray-800 flex items-center gap-2">
        <PlusCircle className="w-5 h-5 text-amber-500" />
        Add New Expense
      </h2>

      {/* Title */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Title</label>
        <input
          type="text"
          name="title"
          value={formData.title}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., Diesel Purchase"
        />
      </div>

      {/* Amount */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Amount (₦)</label>
        <input
          type="number"
          name="amount"
          value={formData.amount}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., 25000"
        />
      </div>

      {/* Category */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Category</label>
        <select
          name="category"
          value={formData.category}
          onChange={handleChange}
          required
          className="w-full p-3 border border-gray-300 rounded-lg bg-white"
        >
          <option value="" disabled>
            Select Category
          </option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
          <option value="Other">Other</option>
        </select>
      </div>

      {/* Custom Category Input */}
      {isOtherCategory && (
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Enter Custom Category</label>
          <input
            type="text"
            value={customCategory}
            onChange={(e) => setCustomCategory(e.target.value)}
            required
            className="w-full p-3 border border-gray-300 rounded-lg"
            placeholder="Enter your category"
          />
        </div>
      )}

      {/* Location */}
      <div className="space-y-2">
        <label className="hidden block text-sm font-medium text-gray-700">Location (Optional)</label>
        <input
          type="text"
          name="location"
          value={formData.location}
          onChange={handleChange}
          className=" hidden w-full p-3 border border-gray-300 rounded-lg"
          placeholder="e.g., Ibile 1"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="block text-sm font-medium text-gray-700">Description (Optional)</label>
        <textarea
          name="description"
          value={formData.description}
          onChange={handleChange}
          rows={3}
          className="w-full p-3 border border-gray-300 rounded-lg"
          placeholder="Add any relevant notes..."
        />
      </div>

      {/* Submit Button */}
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg flex items-center justify-center transition duration-200 disabled:opacity-50"
      >
        {loading ? (
          <>
            <Loader2 className="animate-spin h-5 w-5 mr-2" />
            Saving...
          </>
        ) : (
          "Add Expense"
        )}
      </button>
    </form>
  );
}
