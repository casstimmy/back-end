import axios from "axios";
import { useRouter } from "next/router";
import { useState, useEffect } from "react";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash } from "@fortawesome/free-solid-svg-icons";
import Loader from "./Loader";

export default function ProductForm({
  _id,
  name: currentName,
  description: currentDescription,
  costPrice: currentCostPrice,
  taxRate: currentTaxRate,
  salePriceIncTax: currentSalePriceIncTax,
  margin: currentMargin,
  barcode: currentBarcode,
  category: currentCategory,
  images: currentImages,
  properties: currentProperties, // Assuming it's an array
}) {
  const router = useRouter();

  // States for input fields and operations
  const [name, setName] = useState(currentName || "");
  const [description, setDescription] = useState(currentDescription || "");
  const [costPrice, setCostPrice] = useState(currentCostPrice || "");
  const [taxRate, setTaxRate] = useState(currentTaxRate || "4.5");
  const [salePriceIncTax, setSalePriceIncTax] = useState(
    currentSalePriceIncTax || ""
  );
  const [margin, setMargin] = useState(currentMargin || "");
  const [barcode, setBarcode] = useState(currentBarcode || "");
  const [category, setCategory] = useState(currentCategory || "Top Level");
  const [categories, setCategories] = useState([]);
  const [images, setImages] = useState(currentImages || []);
  const [properties, setProperties] = useState(currentProperties || []); // Changed to an array
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [goToProducts, setGoToProducts] = useState(false);

  // Fetch available categories on component load
  useEffect(() => {
    axios.get("/api/categories").then((result) => setCategories(result.data));
  }, []);

  // Calculate sale price and margin dynamically
  useEffect(() => {
    if (costPrice && taxRate) {
      const taxMultiplier = 1 + Number(taxRate) / 100;
      const calculatedSalePrice = (Number(costPrice) * taxMultiplier).toFixed(
        2
      );
      setSalePriceIncTax(calculatedSalePrice);

      const marginValue = ((calculatedSalePrice - costPrice) / costPrice) * 100;
      setMargin(marginValue.toFixed(2));
    }
  }, [costPrice, taxRate]);

  // Update sale price when margin changes
  useEffect(() => {
    if (costPrice && margin) {
      const calculatedSalePrice =
        Number(costPrice) * (1 + Number(margin) / 100);
      setSalePriceIncTax(calculatedSalePrice.toFixed(2));
    }
  }, [costPrice, margin]);

  // Function to save product
  async function saveProduct(ev) {
    ev.preventDefault();

    if (!name || !description || !costPrice || !salePriceIncTax || properties.length === 0) {
      setErrorMessage("Some fields are not filled.");
      return;
    }

    if (isNaN(costPrice) || Number(costPrice) <= 0) {
      setErrorMessage("Cost Price must be a positive number.");
      return;
    }

    setErrorMessage("");
    const data = {
      name,
      description,
      costPrice,
      taxRate,
      salePriceIncTax,
      margin,
      barcode,
      category,
      images,
      properties, // Properties as an array
    };

    try {
      if (_id) {
        await axios.put("/api/products", { ...data, _id });
      } else {
        await axios.post("/api/products", data);
        setSuccessMessage("Product added successfully!");
      }
      setGoToProducts(true);
    } catch (error) {
      setErrorMessage("Failed to save product. Please try again.");
    }
  }

  // Function to handle image upload
  async function uploadImages(ev) {
    const imgFiles = ev.target?.files;

    if (imgFiles?.length > 0) {
      setLoading(true);

      const data = new FormData();
      for (const file of imgFiles) {
        data.append("file", file);
      }

      try {
        const res = await axios.post("/api/upload", data);
        setImages((oldImages) => [...oldImages, ...res.data.links]);
      } catch (error) {
        console.error("Error uploading images:", error);
      } finally {
        setLoading(false);
      }
    }
  }

  // Function for Add Property
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

  // Function to remove an image
  function removeImage(imageLink) {
    setImages((oldImages) => oldImages.filter((img) => img !== imageLink));
  }

  // Redirect to product management page
  useEffect(() => {
    if (goToProducts) {
      router.push("/manage/products");
    }
  }, [goToProducts, router]);

  // Cancel and reset to initial state
  function handleCancel() {
    setName(currentName || "");
    setDescription(currentDescription || "");
    setCostPrice(currentCostPrice || "");
    setTaxRate(currentTaxRate || "4.5");
    setSalePriceIncTax(currentSalePriceIncTax || "");
    setMargin(currentMargin || "");
    setBarcode(currentBarcode || "");
    setCategory(currentCategory || "Top Level");
    setImages(currentImages || []);
    setProperties(currentProperties || []); // Reset properties array
    setErrorMessage("");
    setSuccessMessage("");
    setGoToProducts(true);
  }

  return (
    <form
      onSubmit={saveProduct}
      onKeyDown={(ev) => ev.key === "Enter" && ev.preventDefault()}
    >
      <div>
        <div className="border border-gray-300 rounded-sm p-6 bg-white">
          <h2 className="text-lg font-semibold mb-6">Product Details</h2>

          <InputField
            label="Name"
            value={name}
            setValue={setName}
            placeholder="Enter product name"
          />
          <InputField
            label="Description"
            value={description}
            setValue={setDescription}
            placeholder="Enter product description"
          />
          <InputField
            label="Cost Price (Exc. Tax)"
            value={costPrice}
            setValue={setCostPrice}
            placeholder="Enter cost price"
            type="number"
          />
          <SelectField
            label="Tax Rate"
            value={taxRate}
            setValue={setTaxRate}
            options={[{ value: "4.5", label: "4.5%" }, { value: "7.5", label: "7.5%" }]}
          />
          <InputField
            label="Sale Price (Inc. Tax)"
            value={salePriceIncTax}
            setValue={setSalePriceIncTax}
            placeholder="Enter sale price including tax"
            type="number"
          />
          <InputField
            label="Margin %"
            value={margin}
            setValue={setMargin}
            placeholder="Enter margin percentage"
            type="number"
          />
          <InputField
            label="Barcode"
            value={barcode}
            setValue={setBarcode}
            placeholder="Enter product barcode"
            type="number"
          />
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
                  placeholder="Property name (e.g., color)"
                />
                <input
                  className="border w-full py-2 px-4 rounded-sm"
                  value={property.propValue}
                  onChange={(ev) =>
                    handlePropertyValueChange(index, ev.target.value)
                  }
                  type="text"
                  placeholder="Property value (e.g., red)"
                />
                <button
                  type="button"
                  onClick={() => removeProperty(index)}
                  className="text-red-500"
                >
                  <FontAwesomeIcon icon={faTrash} />
                </button>
              </div>
            ))}
            <button
              type="button"
              onClick={addProperty}
              className="border py-2 px-4 mb-3 rounded bg-blue-500 text-white"
            >
              Add Property
            </button>
          </div>
          <SelectField
            label="Category"
            value={"Top Level" || category}
            setValue={setCategory}
            options={categories.map((c) => ({
              value: c._id,
              label: c.name,
            }))}
          />

          <div>
            <label className="text-gray-600  font-medium mb-2">Photos</label>
            <div className="flex flex-wrap gap-1">
              <label className="w-24 h-24 border cursor-pointer rounded-md 
              text-center flex flex-col items-center shadow-sm bg-gray-300 justify-center
              border border-gray-400 text-sm text-gray-500">
                + Upload
                <input type="file" onChange={uploadImages} className="hidden" />
              </label>

              {images.map((link) => (
                <div
                  key={link}
                  className="relative w-24 h-24 ml-3 bg-white shadow-sm border border-gray-200 rounded-md overflow-hidden group"
                >
                  <img
                    src={link}
                    alt="Product Image"
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImage(link)}
                    className="absolute top-1 right-1 bg-red-500 text-white rounded p-1"
                  >
                    <FontAwesomeIcon icon={faTrash} />
                  </button>
                </div>
              ))}

              {loading && (
                <div className="w-24 h-24 flex items-center justify-center">
                  <Loader />
                </div>
              )}
            </div>
          </div>

          <div className="flex flex-col items-end mt-6 space-y-4">
            {errorMessage && (
              <div className="w-full text-center text-red-600 bg-red-100 border border-red-200 rounded-lg p-2">
                {errorMessage}
              </div>
            )}
            {successMessage && (
              <div className="w-full text-center text-green-600 bg-green-100 border border-green-200 rounded-lg p-2">
                {successMessage}
              </div>
            )}
            <div className="flex space-x-4">
              <button
                type="button"
                className="px-5 py-2 bg-gray-200 text-gray-800 rounded-lg shadow hover:bg-gray-300"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-500 text-white rounded-lg shadow hover:bg-blue-600"
              >
                Save
              </button>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
}
function InputField({ label, value, setValue, placeholder, type = "text" }) {
  return (
    <div className="mb-4">
      <label className="text-gray-600 font-medium mb-2">{label}</label>
      <input
        type={type}
        className="w-full px-3 py-2 border rounded-md focus:outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function SelectField({ label, value, setValue, options }) {
  return (
    <div className="mb-4">
      <label className="text-gray-600 font-medium mb-2">{label}</label>
      <select
        className="w-full px-3 py-2 border rounded-md focus:outline-none"
        value={value}
        onChange={(e) => setValue(e.target.value)}
      >
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
    </div>
  );
}
