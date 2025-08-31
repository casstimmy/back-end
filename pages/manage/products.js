import { useState, useEffect } from "react";
import { Search, X, Mail } from "lucide-react";
import Layout from "@/components/Layout";
import axios from "axios";
import Link from "next/link";

export default function Products() {
  const [allProducts, setAllProducts] = useState([]);
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState({});
  const [editIndex, setEditIndex] = useState(null);
  const [editableProduct, setEditableProduct] = useState({});
  const [searchTerm, setSearchTerm] = useState("");
  const [properties, setProperties] = useState([]);

  // Fetch products and categories
  useEffect(() => {
    // Fetch products
    axios.get("/api/products").then((response) => {
      setAllProducts(response.data);
      setProducts(response.data);
    });

    // Fetch categories
    axios.get("/api/categories").then((response) => {
      const categoryMap = response.data.reduce((acc, category) => {
        acc[category._id] = category.name;
        return acc;
      }, {});
      setCategories(categoryMap);
    });
  }, []);

  // Search and filter functionality
  const handleSearch = () => {
    const filteredProducts = allProducts.filter((product) => {
      const searchTermLower = searchTerm.toLowerCase();

      // Search through name, barcode, category, description, price, and category name
      return (
        product.name?.toLowerCase().includes(searchTermLower) ||
        product.barcode?.toLowerCase().includes(searchTermLower) ||
        product.description?.toLowerCase().includes(searchTermLower) ||
        product.category?.toLowerCase().includes(searchTermLower) ||
        product.price?.toString().includes(searchTermLower) ||
        categories[product.category]?.toLowerCase().includes(searchTermLower)
      );
    });
    setProducts(filteredProducts);
  };

  const handleEditClick = (index, product) => {
    setEditIndex(index);
    setEditableProduct({ ...product });

    setProperties(product.properties || []);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditableProduct((prev) => {
      const updatedProduct = { ...prev, [name]: value };
      if (["costPrice", "margin", "taxRate"].includes(name)) {
        updatedProduct.salePriceIncTax = calculateSalePrice(
          parseFloat(updatedProduct.costPrice) || 0,
          parseFloat(updatedProduct.margin) || 0,
          parseFloat(updatedProduct.taxRate) || 0
        );
      }
      return updatedProduct;
    });
  };

  const handleUpdateClick = async (_id) => {
    try {
      const updatedProduct = {
        ...editableProduct,
        properties: properties,
      };

      await axios.put("/api/products", { ...updatedProduct, _id });

      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product._id === _id ? { ...product, ...updatedProduct } : product
        )
      );
      setEditIndex(null);
    } catch (error) {
      console.error("Failed to update product:", error);
      alert("Failed to update product. Please try again.");
    }
  };

  const handleCancelClick = () => {
    setEditIndex(null);
    setEditableProduct({});
    setProperties([]);
  };

  //Function for Add Property
  function addProperty() {
    setProperties((prevProperties) => [
      ...prevProperties,
      { propName: "", propValue: "" },
    ]);
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

  function removeProperty(indexToRemove) {
    setProperties((prev) => {
      return [...prev].filter((props, propsIndex) => {
        return propsIndex !== indexToRemove;
      });
    });
  }

  const calculateSalePrice = (costPrice, margin, taxRate) => {
    const marginMultiplier = 1 + margin / 100;
    const taxMultiplier = 1 + taxRate / 100;
    return (costPrice * marginMultiplier * taxMultiplier).toFixed(2);
  };

  // Function to handle monetary fields with `₦` symbol
  const renderMonetaryField = (name, value, editable, className = "") => {
    return editIndex === editable ? (
      <input
        name={name}
        value={editableProduct[name] || ""}
        onChange={(e) => handleChange(e)}
        type="number"
        className={`w-32 border border-gray-300 p-2 rounded-md ${className}`}
      />
    ) : (
      `₦${value}`
    );
  };

  return (
    <Layout>
      <div>
        <div className="w-full border-b p-4 shadow-md">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-3xl text-blue-900 font-bold mb-2">Manage Products</h1>
            <Link href="../products/new">
              <div className="py-2 px-6 bg-blue-600 text-white rounded-sm">
                Add Product
              </div>
            </Link>
          </div>

          <div className="flex flex-col gap-8 sm:flex-row items-center justify-between mb-4 w-full">
            <div className="w-full relative">
               <span className="absolute left-3 top-3.5 text-gray-400">
                            <Search className="w-5 h-5" />
                          </span>
              <input
                type="text"
                placeholder="Search by Product, Barcode, Supplier or SKU"
                className="border w-full py-2 pl-10 pr-4 py-3 rounded-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <button
              onClick={handleSearch} // Trigger search on button click
              className="py-2 px-6 bg-blue-600 text-white rounded-sm"
            >
              Search
            </button>
          </div>

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
                    placeholder="Property name (e.g., 'Color')"
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
                    className="py-2 px-4 border border-red-600 text-red-600 rounded-sm hover:bg-red-600 hover:text-white transition duration-300"
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

        <div className="mt-8 w-full overflow-x-auto">
          <table className="min-w-full border border-gray-300 mx-auto">
            <thead className="bg-gray-200 text-gray-700">
              <tr>
                <th className="p-3 border-b w-20 text-xs text-left"></th>
                <th className="p-3 border-b w-20 text-xs text-left"></th>
                <th className="p-3 border-b w-56 text-xs text-left">Name</th>
                <th className="p-3 border-b w-64 text-xs text-left">
                  Description
                </th>
                <th className="p-3 border-b w-40 text-xs text-left">
                  Cost Price (Exc. Tax)
                </th>
                <th className="p-3 border-b w-24 text-xs text-left">
                  Tax Rate
                </th>
                <th className="p-3 border-b w-40 text-xs text-left">
                  Sale Price (Inc. Tax)
                </th>
                <th className="p-3 border-b w-24 text-xs text-left">
                  Margin %
                </th>
                <th className="p-3 border-b w-40 text-xs text-left">Barcode</th>
                <th className="p-3 border-b w-56 text-xs text-left">
                  Property
                </th>
                <th className="p-3 border-b w-56 text-xs text-left">
                  Category
                </th>
                <th className="p-3 border-b w-56 text-xs text-left"></th>
              </tr>
            </thead>
            <tbody className="text-sm text-gray-600">
              {products.map((product, index) => (
                <tr key={product._id} className="hover:bg-gray-50">
                  <td className="p-2 border-b text-left align-top">
                    {editIndex === index ? (
                      <div className="flex flex-col items-center justify-center space-y-1">
                        <button
                          onClick={() => handleUpdateClick(product._id)}
                          className="w-20 py-1 px-4 border border-green-600 bg-green-500 text-white rounded-sm hover:bg-green-700 hover:text-white transition duration-300"
                        >
                          Update
                        </button>
                        <button
                          onClick={handleCancelClick}
                          className="w-20 py-1 px-4 border border-red-600 bg-red-500 text-white rounded-sm hover:bg-red-700 hover:text-white transition duration-300"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleEditClick(index, product)}
                        className="py-2 px-6 border border-blue-600 text-blue-600 rounded-sm hover:bg-blue-600 hover:text-white transition duration-300"
                      >
                        Edit
                      </button>
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    <Link href={"/products/edit/" + product._id}>
                      <button className="py-2 px-6 border border-blue-600 text-blue-600 rounded-sm hover:bg-blue-600 hover:text-white transition duration-300">
                        Advanced
                      </button>
                    </Link>
                  </td>
                  <td className="p-2 border-b break-words text-left align-top">
                    {editIndex === index ? (
                      <input
                        name="name"
                        value={editableProduct.name || ""}
                        onChange={handleChange}
                        className="w-48 border border-gray-300 p-2 rounded-md"
                      />
                    ) : (
                      product.name
                    )}
                  </td>
                  <td className="p-2 border-b break-words text-left align-top">
                    {editIndex === index ? (
                      <input
                        name="description"
                        value={editableProduct.description || ""}
                        onChange={handleChange}
                        className="w-48 border border-gray-300 p-2 rounded-md"
                      />
                    ) : (
                      product.description
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {renderMonetaryField("costPrice", product.costPrice, index)}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {editIndex === index ? (
                      <input
                        name="taxRate"
                        value={editableProduct.taxRate || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-24 border border-gray-300 p-2 rounded-md"
                      />
                    ) : (
                      product.taxRate
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {renderMonetaryField(
                      "salePriceIncTax",
                      product.salePriceIncTax,
                      index,
                      "bg-gray-200"
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {editIndex === index ? (
                      <input
                        name="margin"
                        value={editableProduct.margin || ""}
                        onChange={handleChange}
                        type="number"
                        className="w-24 border border-gray-300 p-2 rounded-md"
                      />
                    ) : (
                      product.margin
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {editIndex === index ? (
                      <input
                        name="barcode"
                        value={editableProduct.barcode || ""}
                        onChange={handleChange}
                        className="w-40 border border-gray-300 p-2 rounded-md"
                      />
                    ) : (
                      product.barcode
                    )}
                  </td>
                  <td className="p-2 border-b break-words text-left align-top">
                    {product.properties?.length > 0 ? (
                      <ul className="list-disc pl-5">
                        {product.properties.map((property, idx) => (
                          <li key={idx}>
                            <strong>{property.propName}</strong>:{" "}
                            {property.propValue}
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "No Properties"
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    {editIndex === index ? (
                      <select
                        name="category"
                        value={editableProduct.category || ""}
                        onChange={handleChange}
                        className="w-40 border border-gray-300 p-2 rounded-md"
                      >
                        <option>Top Level</option>
                        {Object.entries(categories).map(([id, name]) => (
                          <option key={id} value={id}>
                            {name}
                          </option>
                        ))}
                      </select>
                    ) : (
                      categories[product.category] || "Top Level"
                    )}
                  </td>
                  <td className="p-2 border-b text-left align-top">
                    <Link href={"/products/delete/" + product._id}>
                      <button className="py-2 px-4 border border-red-600 text-red-600 rounded-sm hover:bg-red-600 hover:text-white transition duration-300">
                        X
                      </button>
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Layout>
  );
}
