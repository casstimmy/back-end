import Layout from "@/components/Layout";
import { useState, useEffect } from "react";
import Link from "next/link";
import axios from "axios";

export default function Categories() {
  const [name, setName] = useState("");
  const [image, setImage] = useState(""); 
  const [categories, setCategories] = useState([]);
  const [parentCategory, setParentCategory] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [editIndex, setEditIndex] = useState(null);
  const [properties, setProperties] = useState([]);
  const [editedCategory, setEditedCategory] = useState({
    name: "",
    parentCategory: "",
    image: "",
  });

  // Fetch categories
  useEffect(() => {
    axios.get("/api/categories").then((response) => {
      const updatedCategories = response.data.map((category) => ({
        ...category,
        parentCategory: category?.parent,
      }));
      setCategories(updatedCategories);
    });
  }, []);

  // Add Property
  function addProperty() {
    setProperties((prev) => [...prev, { propName: "", propValue: "" }]);
  }
  function handlePropertyNameChange(index, newName) {
    setProperties((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], propName: newName };
      return updated;
    });
  }
  function handlePropertyValueChange(index, newValue) {
    setProperties((prev) => {
      const updated = [...prev];
      updated[index] = { ...updated[index], propValue: newValue };
      return updated;
    });
  }
  function removeProperty(index) {
    setProperties((prev) => prev.filter((_, i) => i !== index));
  }

  // Upload image (for new or edit)
  async function uploadImage(ev, isEdit = false) {
    const file = ev.target?.files?.[0];
    if (!file) return;

    const data = new FormData();
    data.append("file", file);

    try {
      const res = await axios.post("/api/upload", data);
      const url = res.data.links[0];
      if (isEdit) {
        setEditedCategory((prev) => ({ ...prev, image: url }));
      } else {
        setImage(url);
      }
    } catch (err) {
      console.error("Image upload failed:", err);
      alert("Upload failed");
    }
  }

  // Save new category
  async function saveCategory(ev) {
    ev.preventDefault();
    const response = await axios.post("/api/categories", {
      name,
      parentCategory,
      image,
    });
    setCategories((prev) => [...prev, response.data]);
    setName("");
    setParentCategory("");
    setImage("");
  }

  // Edit
  const handleEditClick = (index, category) => {
    setEditIndex(index);
    setEditedCategory({
      name: category.name,
      parentCategory: category.parent?._id || "",
      image: category.image || "",
    });
    setProperties(category.properties || []);
  };
  const handleUpdateClick = async (_id) => {
    try {
      const response = await axios.put("/api/categories", {
        ...editedCategory,
        properties,
        _id,
      });
      setCategories((prev) =>
        prev.map((cat) => (cat._id === _id ? response.data : cat))
      );
      setEditIndex(null);
      setEditedCategory({ name: "", parentCategory: "", image: "" });
      setProperties([]);
    } catch (error) {
      console.error("Failed to update category:", error);
      alert("Update failed");
    }
  };
  const handleCancelClick = () => {
    setEditIndex(null);
    setEditedCategory({ name: "", parentCategory: "", image: "" });
    setProperties([]);
  };

  // Filtered categories
  const filteredCategories = categories.filter((category) =>
    category.name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <Layout>
      <div className="w-full border-b p-4 shadow-md">
        <h1 className="text-3xl text-blue-900 font-bold mb-4">Categories</h1>

        {/* Add New Category */}
        <form
          onSubmit={saveCategory}
          className="flex flex-col gap-6 sm:flex-row items-center justify-between mb-6 w-full"
        >
          <input
            type="text"
            placeholder="Add New Category"
            className="border w-full py-2 px-4 rounded-sm"
            value={name}
            onChange={(ev) => setName(ev.target.value)}
          />

          {/* Upload Image */}
          <label className="w-32 h-12 border cursor-pointer flex items-center justify-center bg-gray-200 rounded shadow">
            Upload Image
            <input type="file" onChange={(e) => uploadImage(e)} className="hidden" />
          </label>
          {image && (
            <img
              src={image}
              alt="preview"
              className="w-16 h-16 object-cover rounded"
            />
          )}

          <select
            className="border py-2 px-4 rounded-sm"
            onChange={(e) => setParentCategory(e.target.value)}
            value={parentCategory}
          >
            <option value="">No Parent Category</option>
            {categories.map((cat) => (
              <option key={cat._id} value={cat._id}>
                {cat.name}
              </option>
            ))}
          </select>

          <button
            type="submit"
            className="py-2 px-6 bg-blue-600 text-white rounded-sm"
          >
            Save
          </button>
        </form>

        {/* Edit Properties (when editing) */}
        {editIndex !== null && (
          <div className="mt-4">
            <h3 className="text-lg font-semibold">Edit Properties</h3>
            {properties.map((property, index) => (
              <div
                key={index}
                className="flex flex-col gap-4 sm:flex-row items-center justify-between mb-4 w-full"
              >
                <input
                  className="border w-full py-2 px-4 rounded-sm"
                  value={property.propName}
                  onChange={(ev) =>
                    handlePropertyNameChange(index, ev.target.value)
                  }
                  type="text"
                  placeholder="Property name"
                />
                <input
                  className="border w-full py-2 px-4 rounded-sm"
                  value={property.propValue}
                  onChange={(ev) =>
                    handlePropertyValueChange(index, ev.target.value)
                  }
                  type="text"
                  placeholder="Values, comma-separated"
                />
                <button
                  onClick={() => removeProperty(index)}
                  type="button"
                  className="py-2 px-4 border border-red-600 text-red-600 rounded-sm hover:bg-red-600 hover:text-white transition"
                >
                  Remove
                </button>
              </div>
            ))}
            <button
              onClick={addProperty}
              type="button"
              className="py-2 mt-2 px-6 bg-blue-600 text-white rounded-sm"
            >
              Add New Property
            </button>
          </div>
        )}
      </div>

      {/* Categories List */}
      <div className="mt-8 w-full overflow-x-auto">
        <table className="min-w-full border border-gray-300 mx-auto">
          <thead className="bg-gray-200 text-gray-700">
            <tr>
              <th className="p-3 border-b text-xs text-left">Actions</th>
              <th className="p-3 border-b text-xs text-left">Name</th>
              <th className="p-3 border-b text-xs text-left">Parent</th>
              <th className="p-3 border-b text-xs text-left">Image</th>
              <th className="p-3 border-b text-xs text-left">Properties</th>
              <th className="p-3 border-b text-xs text-left">Delete</th>
            </tr>
          </thead>
          <tbody className="text-sm text-gray-600">
            {filteredCategories.map((category, index) => (
              <tr key={category._id} className="hover:bg-gray-50">
                {/* Actions */}
                <td className="p-2 border-b">
                  {editIndex === index ? (
                    <div className="flex flex-col gap-1">
                      <button
                        onClick={() => handleUpdateClick(category._id)}
                        className="py-1 px-3 bg-green-600 text-white rounded-sm"
                      >
                        Update
                      </button>
                      <button
                        onClick={handleCancelClick}
                        className="py-1 px-3 bg-red-500 text-white rounded-sm"
                      >
                        Cancel
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => handleEditClick(index, category)}
                      className="py-1 px-3 border border-blue-600 text-blue-600 rounded-sm hover:bg-blue-600 hover:text-white transition"
                    >
                      Edit
                    </button>
                  )}
                </td>

                {/* Name */}
                <td className="p-2 border-b">
                  {editIndex === index ? (
                    <input
                      type="text"
                      className="border py-1 px-2 rounded-sm"
                      value={editedCategory.name}
                      onChange={(e) =>
                        setEditedCategory({ ...editedCategory, name: e.target.value })
                      }
                    />
                  ) : (
                    category.name
                  )}
                </td>

                {/* Parent */}
                <td className="p-2 border-b">
                  {editIndex === index ? (
                    <select
                      className="border py-1 px-2 rounded-sm"
                      value={editedCategory.parentCategory}
                      onChange={(e) =>
                        setEditedCategory({
                          ...editedCategory,
                          parentCategory: e.target.value,
                        })
                      }
                    >
                      <option value="">No Parent</option>
                      {categories.map((cat) => (
                        <option key={cat._id} value={cat._id}>
                          {cat.name}
                        </option>
                      ))}
                    </select>
                  ) : (
                    category.parent?.name || "No Parent"
                  )}
                </td>

                {/* Image */}
                <td className="p-2 border-b">
                  {editIndex === index ? (
                    <div>
                      <label className="w-28 h-10 border cursor-pointer flex items-center justify-center bg-gray-200 rounded shadow">
                        Change
                        <input
                          type="file"
                          onChange={(e) => uploadImage(e, true)}
                          className="hidden"
                        />
                      </label>
                      {editedCategory.image && (
                        <img
                          src={editedCategory.image}
                          alt="preview"
                          className="w-16 h-16 mt-2 object-cover rounded"
                        />
                      )}
                    </div>
                  ) : category.image ? (
                    <img
                      src={category.image}
                      alt={category.name}
                      className="w-20 h-20 object-cover rounded"
                    />
                  ) : (
                    "No Image"
                  )}
                </td>

                {/* Properties */}
                <td className="p-2 border-b">
                  {category.properties?.length ? (
                    <ul className="list-disc pl-5">
                      {category.properties.map((property, idx) => (
                        <li key={idx}>
                          <strong>{property.propName}</strong>: {property.propValue}
                        </li>
                      ))}
                    </ul>
                  ) : (
                    "No Properties"
                  )}
                </td>

                {/* Delete */}
                <td className="p-2 border-b">
                  <Link href={"/category/delete/" + category._id}>
                    <button className="py-1 px-3 border border-red-600 text-red-600 rounded-sm hover:bg-red-600 hover:text-white transition">
                      X
                    </button>
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Layout>
  );
}
