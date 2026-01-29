import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import axios from "axios";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faSave, faTimes } from "@fortawesome/free-solid-svg-icons";
import Loader from "@/components/Loader";

export default function Categories() {
  const [name, setName] = useState("");
  const [images, setImages] = useState([]);
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [editedCategory, setEditedCategory] = useState({
    name: "",
    parentCategory: "",
    images: [],
    properties: [],
  });
  const [properties, setProperties] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch categories
  const fetchCategories = async () => {
    try {
      const res = await axios.get("/api/categories");
      setCategories(res.data || []);
    } catch (err) {
      console.error(err);
      alert("Failed to fetch categories");
    }
  };

  useEffect(() => {
    fetchCategories();
  }, []);

// --- Image Upload ---
const uploadImage = async (ev, isEdit = false) => {
  const files = ev.target.files;
  if (!files?.length) return;

  // Preview placeholders
  const previews = Array.from(files).map((f) => ({
    full: URL.createObjectURL(f),
    thumb: URL.createObjectURL(f),
    isTemp: true,
  }));

  if (isEdit) {
    // REPLACE instead of append
    setEditedCategory((prev) => ({
      ...prev,
      images: previews,
    }));
  } else {
    setImages(previews);
  }

  const formData = new FormData();
  for (const f of files) formData.append("file", f);

  setLoading(true);
  try {
    const res = await axios.post("/api/upload", formData);
    const uploaded = res.data?.links || [];
    if (!uploaded.length) throw new Error("Upload failed");

    const formatted = uploaded.map((link) => ({
      full: typeof link === "string" ? link : link.full || link,
      thumb: typeof link === "string" ? link : link.thumb || link,
      isTemp: false,
    }));

    if (isEdit) {
      setEditedCategory((prev) => ({
        ...prev,
        images: formatted, // replace with final uploaded
      }));
    } else {
      setImages(formatted); // replace with final uploaded
    }
  } catch (err) {
    console.error(err);
    alert("Upload failed");

    // Rollback previews if failed
    if (isEdit) {
      setEditedCategory((prev) => ({
        ...prev,
        images: prev.images.filter((img) => !img.isTemp),
      }));
    } else {
      setImages((prev) => prev.filter((img) => !img.isTemp));
    }
  } finally {
    setLoading(false);
  }
};


  // --- Remove Image ---
  const removeImage = (index, isEdit = false) => {
    if (isEdit) {
      setEditedCategory((prev) => ({
        ...prev,
        images: prev.images.filter((_, i) => i !== index),
      }));
    } else {
      setImages((prev) => prev.filter((_, i) => i !== index));
    }
  };

  // --- Properties ---
  const addProperty = (isEdit = false) => {
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: [...prev.properties, { propName: "", propValue: "" }],
      }));
    else
      setProperties((prev) => [
        ...prev,
        { propName: "", propValue: "" },
      ]);
  };

  const handlePropertyChange = (index, key, value, isEdit = false) => {
    if (isEdit) {
      setEditedCategory((prev) => {
        const updated = [...prev.properties];
        updated[index][key] = value;
        return { ...prev, properties: updated };
      });
    }
  };

  const removeProperty = (index, isEdit = false) => {
    if (isEdit)
      setEditedCategory((prev) => ({
        ...prev,
        properties: prev.properties.filter((_, i) => i !== index),
      }));
  };

  // --- Save New Category ---
  const saveCategory = async (ev) => {
    ev.preventDefault();
    if (!name.trim() || !images.length)
      return alert("Name and at least one image required");

    const formattedImages = images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.post("/api/categories", {
        name,
        parentCategory: parentCategory || null,
        images: formattedImages,
        properties,
      });
      setCategories((prev) => [...prev, res.data]);
      setName("");
      setParentCategory("");
      setImages([]);
      setProperties([]);
    } catch (err) {
      console.error(err);
      alert("Failed to save category");
    }
  };

  // --- Edit & Update ---
  const handleEditClick = (index, category) => {
    setEditIndex(index);
    setEditedCategory({
      _id: category._id,
      name: category.name || "",
      parentCategory: category.parent?._id || "",
      images: category.images || [],
      properties: category.properties || [],
    });
  };

  const handleUpdateClick = async (id) => {
    if (!editedCategory.name.trim() || !editedCategory.images?.length)
      return alert("Name and images required");

    const formattedImages = editedCategory.images.map((img) => ({
      full: img.full,
      thumb: img.thumb,
    }));

    try {
      const res = await axios.put("/api/categories", {
        _id: id,
        name: editedCategory.name,
        parentCategory: editedCategory.parentCategory || null,
        images: formattedImages,
        properties: editedCategory.properties,
      });
      setCategories((prev) =>
        prev.map((cat) => (cat._id === id ? res.data : cat))
      );
      handleCancelClick();
    } catch (err) {
      console.error(err);
      alert("Update failed");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditedCategory({ name: "", parentCategory: "", images: [], properties: [] });
  };

  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this category?")) return;
    try {
      await axios.delete("/api/categories?id=" + id);
      setCategories((prev) => prev.filter((cat) => cat._id !== id));
    } catch (err) {
      console.error(err);
      alert("Delete failed");
    }
  };

  const filteredCategories = categories.filter((cat) =>
    cat.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="px-8 py-6">
               <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-4">
          <h1 className="text-2xl font-bold text-amber-900">Categories</h1>
         
        </div>
{/* Add New Category Form */}
<div className="bg-white shadow rounded-sm p-8 mb-6">
  <form
    onSubmit={saveCategory}
    className="space-y-6"
  >
    {/* Header */}
    <div className="border-b pb-4 mb-4">
      <h2 className="text-lg font-semibold text-gray-800">
        Add New Category
      </h2>
      <p className="text-sm text-gray-500">
        Fill in the details below to create a category.
      </p>
    </div>

    {/* Category Info */}
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Category Name
        </label>
        <input
          type="text"
          placeholder="Enter category name"
          className="border px-3 py-2 rounded-sm w-full focus:ring-amber-500 focus:border-amber-500"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Parent Category
        </label>
        <select
          className="border px-3 py-2 rounded-sm w-full focus:ring-amber-500 focus:border-amber-500"
          value={parentCategory}
          onChange={(e) => setParentCategory(e.target.value)}
        >
          <option value="">No Parent</option>
          {categories.map((cat) => (
            <option key={cat._id} value={cat._id}>
              {cat.name}
            </option>
          ))}
        </select>
      </div>
    </div>

    {/* Image Upload */}
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-2">
        Images
      </label>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center">
          <label className="cursor-pointer px-4 py-2 bg-amber-500 text-white rounded-sm hover:bg-amber-600 transition">
            Upload
            <input
              type="file"
              multiple
              onChange={uploadImage}
              className="hidden"
            />
          </label>
          {loading && <Loader />}
        </div>

        <div className="flex gap-3 flex-wrap">
          {images.map((img, i) => (
            <div key={i} className="relative group">
              <img
                src={img.thumb || img.full}
                alt="preview"
                className="w-20 h-20 object-cover rounded-md border"
              />
              <button
                type="button"
                onClick={() => removeImage(i, false)}
                className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
              >
                ✕
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>

    {/* Submit */}
    <div className="pt-4 border-t">
      <button
        type="submit"
        className="px-6 py-2 bg-amber-600 text-white rounded-sm hover:bg-amber-700 transition"
      >
        Save Category
      </button>
    </div>
  </form>
</div>


        {/* Categories Table */}
        <div className="bg-white shadow rounded-sm p-6">
          <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
            <h2 className="text-lg font-semibold text-gray-700">All Categories</h2>
            <input
              type="text"
              placeholder="Search categories..."
              className="border px-3 py-2 rounded-sm w-full md:w-64 focus:ring-amber-500 focus:border-amber-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full border border-gray-200 rounded-sm text-sm">
              <thead className="bg-gray-100 text-gray-700 uppercase tracking-wide text-xs">
                <tr>
                  <th className="p-3 text-left w-1/6">Name</th>
                  <th className="p-3 text-left w-1/6">Parent</th>
                  <th className="p-3 text-left w-1/4">Images</th>
                  <th className="p-3 text-left w-1/4">Properties</th>
                  <th className="p-3 text-center w-1/6">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCategories.map((cat, index) => (
                  <tr
                    key={cat._id}
                    className={`border-t ${
                      index % 2 === 0 ? "bg-white" : "bg-gray-50"
                    } hover:bg-amber-50 transition`}
                  >
                    {editIndex === index ? (
                      <>
                        {/* Editable Name */}
                        <td className="p-3">
                          <input
                            type="text"
                            className="border px-2 py-1 rounded-sm w-full"
                            value={editedCategory.name}
                            onChange={(e) =>
                              setEditedCategory((prev) => ({
                                ...prev,
                                name: e.target.value,
                              }))
                            }
                          />
                        </td>

                        {/* Editable Parent */}
                        <td className="p-3">
                          <select
                            className="border px-2 py-1 rounded-sm w-full"
                            value={editedCategory.parentCategory}
                            onChange={(e) =>
                              setEditedCategory((prev) => ({
                                ...prev,
                                parentCategory: e.target.value,
                              }))
                            }
                          >
                            <option value="">No Parent</option>
                            {categories.map((p) => (
                              <option key={p._id} value={p._id}>
                                {p.name}
                              </option>
                            ))}
                          </select>
                        </td>

                        {/* Editable Images */}
                        <td className="p-3">
                          <div className="flex items-center gap-2 mb-2">
                            <label className="cursor-pointer px-2 py-1 bg-amber-500 text-white rounded-sm text-xs">
                              Upload
                              <input
                                type="file"
                                multiple
                                onChange={(e) => uploadImage(e, true)}
                                className="hidden"
                              />
                            </label>
                            {loading && <Loader />}
                          </div>
                          <div className="grid grid-cols-3 gap-2">
                            {(editedCategory.images || []).map((img, i) => (
                              <div key={i} className="relative group">
                                <img
                                  src={img.thumb || img.full}
                                  alt="category"
                                  className="w-12 h-12 object-cover rounded-sm border"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeImage(i, true)}
                                  className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full px-1 opacity-0 group-hover:opacity-100 transition"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                          </div>
                        </td>

                        {/* Editable Properties */}
                        <td className="p-3">
                          <div className="flex flex-col gap-2">
                            {(editedCategory.properties || []).map((p, i) => (
                              <div key={i} className="flex gap-2 items-center">
                                <input
                                  type="text"
                                  placeholder="Name"
                                  value={p.propName}
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      i,
                                      "propName",
                                      e.target.value,
                                      true
                                    )
                                  }
                                  className="border px-2 py-1 rounded-sm text-xs w-1/3"
                                />
                                <input
                                  type="text"
                                  placeholder="Value"
                                  value={p.propValue}
                                  onChange={(e) =>
                                    handlePropertyChange(
                                      i,
                                      "propValue",
                                      e.target.value,
                                      true
                                    )
                                  }
                                  className="border px-2 py-1 rounded-sm text-xs w-1/3"
                                />
                                <button
                                  type="button"
                                  onClick={() => removeProperty(i, true)}
                                  className="text-red-500 text-xs"
                                >
                                  ✕
                                </button>
                              </div>
                            ))}
                            <button
                              type="button"
                              onClick={() => addProperty(true)}
                              className="text-xs px-2 py-1 bg-gray-100 rounded-sm text-gray-600 hover:bg-gray-200"
                            >
                              + Add Property
                            </button>
                          </div>
                        </td>

                        {/* Actions Save / Cancel */}
                        <td className="p-3 flex justify-center gap-3">
                          <button
                            onClick={() => handleUpdateClick(cat._id)}
                            className="px-3 py-1 rounded-sm bg-green-50 text-green-600 hover:bg-green-100 transition"
                          >
                            <FontAwesomeIcon icon={faSave} />
                          </button>
                          <button
                            onClick={handleCancelClick}
                            className="px-3 py-1 rounded-sm bg-gray-50 text-gray-600 hover:bg-gray-100 transition"
                          >
                            <FontAwesomeIcon icon={faTimes} />
                          </button>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="p-3 font-medium text-gray-800">{cat.name}</td>
                        <td className="p-3 text-gray-600">{cat.parent?.name || "-"}</td>
                        <td className="p-3">
                          <div className="grid grid-cols-3 gap-2">
                            {(cat.images || []).map((img, i) => (
                              <img
                                key={i}
                                src={img.thumb || img.full}
                                alt="category"
                                className="w-12 h-12 object-cover rounded-sm border"
                              />
                            ))}
                          </div>
                        </td>
                        <td className="p-3">
                          <div className="flex flex-wrap gap-2">
                            {(cat.properties || []).map((p, i) => (
                              <span
                                key={i}
                                className="bg-gray-100 px-2 py-1 rounded-sm text-xs text-gray-700 border"
                              >
                                {p.propName}: {p.propValue}
                              </span>
                            ))}
                            {(!cat.properties ||
                              cat.properties.length === 0) && (
                              <span className="text-gray-400 italic text-sm">
                                None
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="p-3 flex justify-center gap-3">
                          <button
                            onClick={() => handleEditClick(index, cat)}
                            className="px-3 py-1 rounded-sm bg-blue-50 text-blue-600 hover:bg-blue-100 transition"
                          >
                            <FontAwesomeIcon icon={faEdit} />
                          </button>
                          <button
                            onClick={() => handleDelete(cat._id)}
                            className="px-3 py-1 rounded-sm bg-red-50 text-red-600 hover:bg-red-100 transition"
                          >
                            <FontAwesomeIcon icon={faTrash} />
                          </button>
                        </td>
                      </>
                    )}
                  </tr>
                ))}
                {filteredCategories.length === 0 && (
                  <tr>
                    <td colSpan={5} className="p-4 text-center text-gray-400">
                      No categories found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </Layout>
  );
}
