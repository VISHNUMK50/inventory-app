"use client";
import { useState, useEffect } from "react";
import { use } from "react"; // Import React.use
import Link from "next/link";
import { ArrowLeft, Save, Package, FileText, Download, Eye, ShoppingCart, FileX ,RefreshCw, Tag, Edit, Folder, Trash, DollarSign, AlertCircle, ClipboardList, Home } from "lucide-react";
import githubConfig from '../config/githubConfig';
import Header from "@/components/Header";
import Addproductform from "@/components/Addproductform";

export default function ProductDetail({ params }) {
  // Properly unwrap params using React.use()
  const unwrappedParams = use(params);
  const partName = unwrappedParams?.partName ? decodeURIComponent(unwrappedParams.partName) : null;

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editedProduct, setEditedProduct] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);

  // Initialize editedProduct when product is loaded
  useEffect(() => {
    if (product) {
      setEditedProduct(product);
    }
  }, [product]);

  // Fetch product details on component mount
  useEffect(() => {
    if (partName) {
      fetchProductDetails(partName);
    } else {
      setError("No product specified");
      setIsLoading(false);
    }
  }, [partName]);

  // Fetch product details from GitHub or use sample data
  const fetchProductDetails = async (partNum) => {
    setIsLoading(true);
    setError(null);

    try {
      const { token, repo, owner, path } = githubConfig;

      // If GitHub config is incomplete, use sample data
      if (!token || !repo || !owner) {
        // Try to find product in localStorage
        const localItems = localStorage.getItem('inventoryItems');
        if (localItems) {
          const items = JSON.parse(localItems);
          const foundProduct = items.find(item => item.manufacturerPart === partNum);
          if (foundProduct) {
            setProduct(foundProduct);
            setEditedProduct(foundProduct);
          } else {
            setError("Product not found");
          }

        } else {
          setError("sample data not found");

        }
        setIsLoading(false);
        return;
      }

      // Fix the path to the json folder - remove duplicate "database"
      const jsonDirPath = `${path}/jsons`; // Removed duplicate "database" folder

      // Log the API URL for debugging
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
      console.log("Fetching from:", apiUrl);

      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText} (${response.status})`);
      }

      const files = await response.json();

      // Look for files with format including sanitizedManufacturerPart
      let productFile = files.find(file =>
        file.type === "file" &&
        file.name.endsWith(".json") &&
        file.name.includes(`${partNum}`)
      );

      // If we found a matching file, load its contents
      if (productFile) {
        const fileResponse = await fetch(productFile.download_url);
        if (fileResponse.ok) {
          const fileContent = await fileResponse.json();
          setProduct(fileContent);
          setEditedProduct(fileContent);
        } else {
          throw new Error("Error loading product details");
        }
      } else {
        // If we couldn't find a matching file by name, check each file's content
        let productFound = false;

        for (const file of files) {
          if (file.type === "file" && file.name.endsWith(".json")) {
            const fileResponse = await fetch(file.download_url);
            if (fileResponse.ok) {
              try {
                const fileContent = await fileResponse.json();
                if (fileContent.manufacturerPart === partNum || fileContent.partName === partNum) {
                  setProduct(fileContent);
                  setEditedProduct(fileContent);
                  productFound = true;
                  break;
                }
              } catch (parseError) {
                console.error("Error parsing JSON:", parseError);
                // Continue to next file
              }
            }
          }
        }

        // If we still couldn't find the product, fallback to sample data
        if (!productFound) {
          setError("Product not found");

        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError(error.message);


    } finally {
      setIsLoading(false);
    }
  };

  // Handle edit form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Save changes to product
  // In your existing saveChanges function, add GitHub save functionality
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      // First update local state
      setProduct(editedProduct);

      // Save to localStorage for persistence in demo mode
      const localItems = localStorage.getItem('inventoryItems');
      if (localItems) {
        const items = JSON.parse(localItems);
        const index = items.findIndex(item =>
          item.manufacturerPart === product.manufacturerPart ||
          item.partName === product.partName
        );

        if (index !== -1) {
          items[index] = editedProduct;
          localStorage.setItem('inventoryItems', JSON.stringify(items));
        } else {
          localStorage.setItem('inventoryItems', JSON.stringify([...items, editedProduct]));
        }
      } else {
        localStorage.setItem('inventoryItems', JSON.stringify([editedProduct]));
      }

      // Now let's save to GitHub
      const { token, repo, owner, path } = githubConfig;

      // Only attempt GitHub save if config is valid
      if (token && repo && owner) {
        const jsonDirPath = `${path}/jsons`;

        // First, check if the file exists by listing the directory
        const dirListUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
        const dirResponse = await fetch(dirListUrl, {
          headers: {
            "Authorization": `token ${token}`
          }
        });

        if (!dirResponse.ok) {
          throw new Error(`GitHub API error: ${dirResponse.statusText} (${dirResponse.status})`);
        }

        const files = await dirResponse.json();
        // Create sanitized filename

        const sanitizedManufacturerPart = product.manufacturerPart.replace(/[^a-z0-9]/gi, "-");
        const sanitizedPartName = product.partName.replace(/[^a-z0-9\s]/gi, "-").replace(/\s+/g, "_");

        const fileName = `${sanitizedPartName}-${sanitizedManufacturerPart}.json`;

        // const sanitizedPartName = product.manufacturerPart.replace(/[^a-zA-Z0-9-_]/g, '_');
        // const fileName = `${sanitizedPartName}.json`;

        // Check if file exists
        let existingFile = files.find(file => file.name === fileName);
        let filePath = `${jsonDirPath}/${fileName}`;
        let fileExists = !!existingFile;
        let existingSha = fileExists ? existingFile.sha : null;

        // Prepare file content
        const fileContent = JSON.stringify(editedProduct, null, 2);
        const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

        // Prepare request body
        const requestBody = {
          message: fileExists
            ? `Update product: ${editedProduct.manufacturerPart}`
            : `Add new product: ${editedProduct.manufacturerPart}`,
          content: encodedContent,
        };

        // If updating existing file, include the sha
        if (fileExists && existingSha) {
          requestBody.sha = existingSha;
        }

        // Make PUT request to GitHub API
        const saveUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
        const saveResponse = await fetch(saveUrl, {
          method: 'PUT',
          headers: {
            "Authorization": `token ${token}`,
            "Content-Type": "application/json"
          },
          body: JSON.stringify(requestBody)
        });

        if (!saveResponse.ok) {
          const errorData = await saveResponse.json();
          throw new Error(`GitHub save error: ${errorData.message}`);
        }

        console.log("Successfully saved to GitHub");
      }

      // Success!
      setEditMode(false);
      alert("Product updated successfully");

    } catch (error) {
      console.error("Error saving product:", error);
      setSaveError(error.message);
    } finally {
      setIsSaving(false);
    }
  };



  // If still loading, show a loading spinner
  if (isLoading) {
    return (
      <div className="mx-auto bg-white shadow-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="mx-auto py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8" />
                <span className="text-2xl font-bold">InventoryPro</span>
              </div>
              <h2 className="text-3xl font-bold">Product Details</h2>
              <div>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center">
                  <Home className="h-4 w-4 mr-2" /> Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading product details...</p>
        </div>
      </div>
    );
  }

  // If there's an error, show the error message
  if (error) {
    return (
      <div className="mx-auto bg-white shadow-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="mx-auto py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8" />
                <span className="text-2xl font-bold">InventoryPro</span>
              </div>
              <h2 className="text-3xl font-bold">Product Details</h2>
              <div>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center">
                  <Home className="h-4 w-4 mr-2" /> Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 bg-red-50 flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 text-red-500 mb-4" />
          <p className="text-red-700 text-lg">Error: {error}</p>
          <Link href="/manage-inventory" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  // Add this check at the beginning of your return statement
  if (!product) {
    return (
      <div className="mx-auto bg-white shadow-xl overflow-hidden">
        <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
          <div className="mx-auto py-4 px-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Package className="h-8 w-8" />
                <span className="text-2xl font-bold">InventoryPro</span>
              </div>
              <h2 className="text-3xl font-bold">Product Details</h2>
              <div>
                <Link href="/" className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center">
                  <Home className="h-4 w-4 mr-2" /> Dashboard
                </Link>
              </div>
            </div>
          </div>
        </header>

        <div className="p-6 bg-yellow-50 flex flex-col items-center justify-center">
          <AlertCircle className="w-10 h-10 text-yellow-500 mb-4" />
          <p className="text-yellow-700 text-lg">Product not found or data is unavailable</p>
          <Link href="/manage-inventory" className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      {/* Header */}
      <Header title="Product Detail" />


      {/* Navigation and Action Buttons */}
      <div className="bg-gray-100 px-6 py-3 flex items-center justify-between border-b border-gray-200">
        <Link href="/manage-inventory" className="flex items-center text-blue-600 hover:text-blue-800">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>

        <div className="flex items-center space-x-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </button>

              <button
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700 flex items-center"
                onClick={() => {
                  if (confirm("Are you sure you want to delete this product?")) {
                    alert("Product would be deleted in a real implementation");
                    // Here you would implement the actual deletion
                  }
                }}
              >
                <Trash className="w-4 h-4 mr-2" /> Delete
              </button>
            </>
          ) : (
            <>
              <button
                onClick={saveChanges}
                disabled={isSaving}
                className={`px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
              >
                {isSaving ? (
                  <>
                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" /> Save
                  </>
                )}
              </button>

              <button
                onClick={() => {
                  setEditMode(false);
                  setEditedProduct(product);
                }}
                className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600 flex items-center"
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={() => fetchProductDetails(partName)}
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-4 bg-red-50 border-b border-red-100">
          <div className="flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
            <p className="text-red-700">Error saving product: {saveError}</p>
          </div>
        </div>
      )}

      {/* Product Details */}
      <div className="px-6 py-2">
        {/* Product Details Section */}
        {editMode ? (
          /* Edit Form */
          <div className="rounded-lg">
            {/* Product Identification Section */}
            <div className="mb-6 grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-3">

              <div className=" p-4 bg-blue-50 rounded-lg">

                <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                  <Tag className="mr-2 h-5 w-5" /> Product Identification
                </h3>

                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name *</label>
                    <div className="flex">
                      <input
                        type="text"
                        name="partName"
                        placeholder="Type to search or select partName"
                        value={editedProduct.partName}
                        onChange={handleInputChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <select
                      name="category"
                      value={editedProduct.category}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="">Select a category</option>
                      <option value="electronics">Electronics</option>
                      <option value="mechanical">Mechanical</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Reference</label>
                    <textarea
                      name="customerRef"
                      placeholder="Customer part reference"
                      value={editedProduct.customerRef}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

              {/* Manufacturer Details Section */}
              <div className="bg-pink-50 p-4 rounded-lg md:col-span-1 lg:col-span-2">
                <h3 className="font-medium text-indigo-800 mb-3 flex items-center">
                  <Folder className="mr-2 h-5 w-5" /> Manufacturer Details
                </h3>
                <div className=" grid grid-cols-1 lg:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer *</label>
                    <div className="flex">

                      <input
                        type="text"
                        name="manufacturer"
                        placeholder="Type to search or select manufacturer"
                        value={editedProduct.manufacturer}
                        onChange={handleInputChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Part # *</label>
                    <div className="flex">
                      <input
                        type="text"
                        name="manufacturerPart"
                        placeholder="Type to search or select manufacturerPart"
                        value={editedProduct.manufacturerPart}
                        onChange={handleInputChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <div className="flex">
                      <input
                        type="text"
                        name="vendor"
                        placeholder="Type to search or select vendor"
                        value={editedProduct.vendor}
                        onChange={handleInputChange}
                        className="flex-grow px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Product Link</label>
                    <input
                      type="text"
                      name="vendorProductLink"
                      placeholder="https://vendor.com/product/123"
                      value={editedProduct.vendorProductLink || ''}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      placeholder="Brief description of the part"
                      value={editedProduct.description}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                </div>
              </div>

            </div>
            {/* Pricing Information Section */}
            <div className="mb-6 bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3 flex items-center">
                <DollarSign className="mr-2 h-5 w-5" /> Pricing Information
              </h3>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>Cost Price</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    placeholder="0.00"
                    value={editedProduct.costPrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-green-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9H5v2h2V9zm8 0h-2v2h2V9zM9 9h2v2H9V9z" clipRule="evenodd" />
                    </svg>
                    Sale Price
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    placeholder="0.00"
                    value={editedProduct.salePrice}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Inventory Details Section */}
            <div className="mb-6 p-4 bg-purple-50 rounded-lg">
              <h2 className="flex items-center text-purple-700 font-medium mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M7 3a1 1 0 000 2h6a1 1 0 100-2H7zM4 7a1 1 0 011-1h10a1 1 0 110 2H5a1 1 0 01-1-1zM2 11a2 2 0 012-2h12a2 2 0 012 2v4a2 2 0 01-2 2H4a2 2 0 01-2-2v-4z" />
                </svg>
                Inventory Details
              </h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input
                    type="number"
                    name="quantity"
                    placeholder="0"
                    value={editedProduct.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="flex items-center text-sm font-medium text-gray-700 mb-1">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 mr-1 text-purple-600" viewBox="0 0 20 20" fill="currentColor">
                      <path fillRule="evenodd" d="M5 3a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2V5a2 2 0 00-2-2H5zm0 2h10v7h-2l-1 2H8l-1-2H5V5z" clipRule="evenodd" />
                    </svg>
                    Bin Location
                  </label>
                  <input
                    type="text"
                    name="bin"
                    placeholder="A1-B2-C3"
                    value={editedProduct.bin}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                  <input
                    type="number"
                    name="reorderPoint"
                    placeholder="5"
                    value={editedProduct.reorderPoint}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                  <input
                    type="number"
                    name="reorderQty"
                    placeholder="10"
                    value={editedProduct.reorderQty}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Files & Documentation Section */}
            <div className="p-4 bg-gray-50 rounded-lg">
              <h2 className="text-gray-700 font-medium mb-4">Files & Documentation</h2>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Component Image</label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 mb-2">PNG, JPG, GIF up to 10MB</p>
                    <button className="bg-blue-100 text-blue-600 px-4 py-1 rounded text-sm">Upload Image</button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Datasheet</label>
                  <div className="border border-dashed border-gray-300 rounded-lg p-6 flex flex-col items-center justify-center">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-12 w-12 text-gray-400 mb-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-xs text-gray-500 mb-2">PDF, DOC, XLS up to 10MB</p>
                    <button className="bg-blue-100 text-blue-600 px-4 py-1 rounded text-sm">Upload Datasheet</button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="mx-auto ">
            {/* Product Header */}
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-8 pb-4 border-b">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{product.partName}</h1>
                {product.description ? (
                  <p className="mt-1 text-gray-500">{product.description}</p>
                ) : (
                  <p className="mt-1 text-gray-500 italic">No description available</p>
                )}
              </div>

              {/* Status Badge */}
              <div className="mt-4 md:mt-0 flex items-center">
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${Number(product.quantity) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                  {Number(product.quantity) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 space-y-6">
              {/* Left Column - Image and Quick Stats */}
              <div className="bg-white rounded-lg shadow overflow-hidden">
                {/* Product Image */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center border-b">
                  {product.image ? (
                    <img
                      src={product.image}
                      alt={product.partName}
                      className="object-contain h-full w-full p-2"
                    />
                  ) : (
                    <div className="flex flex-col items-center justify-center text-gray-400">
                      <Package className="h-16 w-16 mb-2" />
                      <span className="text-sm">No image available</span>
                    </div>
                  )}
                </div>

                {/* Quick Stats */}
                <div className="p-4">
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-500">Quantity</span>
                    <span className="font-semibold text-lg">{product.quantity || "0"}</span>
                  </div>

                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium text-gray-500">Category</span>
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </div>

                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium text-gray-500">Manufacturer</span>
                    <span className="font-medium">{product.manufacturer || "Not specified"}</span>
                  </div>
                </div>
                {/* Datasheet Preview */}
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h2 className="text-lg font-medium text-gray-700 flex items-center">
                      <FileText className="h-5 w-5 mr-2 text-blue-600" /> Datasheet
                    </h2>
                  </div>
                  <div className="p-4">
                    {product.datasheet ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="bg-gray-100 h-48 flex items-center justify-center">
                            <FileText className="h-16 w-16 text-gray-400" />
                          </div>
                          <div className="p-3 border-t">
                            <div className="flex items-center justify-between">

                              <span className="text-sm truncate">
                                {product.datasheet ? product.datasheet.split('/').pop() : "Datasheet"}
                              </span>                              <div className="flex space-x-2">
                                <a
                                  href={product.datasheet}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <Download className="mr-1 h-3 w-3" /> Download
                                </a>
                                <button
                                  onClick={() => window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(product.datasheet)}`, '_blank')}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                >
                                  <Eye className="mr-1 h-3 w-3" /> View
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-6 text-gray-400 border border-dashed rounded-lg">
                        <FileX className="h-12 w-12 mb-2" />
                        <p className="text-sm">No datasheet available</p>
                      </div>
                    )}
                  </div>
                </div>
                
              </div>

              {/* Middle Column - Basic Information and Inventory Details */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h2 className="text-lg font-medium text-gray-700 flex items-center">
                      <ClipboardList className="h-5 w-5 mr-2 text-blue-600" /> Basic Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Part Name</td>
                          <td className="py-2 text-sm text-gray-800">{product.partName || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Manufacturer Part</td>
                          <td className="py-2 text-sm text-gray-800">{product.manufacturerPart || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Manufacturer</td>
                          <td className="py-2 text-sm text-gray-800">{product.manufacturer || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Description</td>
                          <td className="py-2 text-sm text-gray-800">{product.description || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h2 className="text-lg font-medium text-gray-700 flex items-center">
                      <Package className="h-5 w-5 mr-2 text-blue-600" /> Inventory Details
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Quantity in Stock</td>
                          <td className="py-2 text-sm text-gray-800">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(product.quantity) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {product.quantity || "0"}
                            </span>
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Bin Location</td>
                          <td className="py-2 text-sm text-gray-800">{product.bin || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Reorder Point</td>
                          <td className="py-2 text-sm text-gray-800">{product.reorderPoint || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Reorder Quantity</td>
                          <td className="py-2 text-sm text-gray-800">{product.reorderQty || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing & References + Datasheet Preview */}
              <div className="space-y-6">
                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h2 className="text-lg font-medium text-gray-700 flex items-center">
                      <DollarSign className="h-5 w-5 mr-2 text-blue-600" /> Pricing
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Cost Price</td>
                          <td className="py-2 text-sm text-gray-800">
                            {product.costPrice ? `$${product.costPrice}` : "Not specified"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Sale Price</td>
                          <td className="py-2 text-sm text-gray-800">
                            {product.salePrice ? `$${product.salePrice}` : "Not specified"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="bg-white rounded-lg shadow overflow-hidden">
                  <div className="px-4 py-5 sm:px-6 bg-gray-50 border-b">
                    <h2 className="text-lg font-medium text-gray-700 flex items-center">
                      <Eye className="h-5 w-5 mr-2 text-blue-600" /> References
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Vendor</td>
                          <td className="py-2 text-sm text-gray-800">{product.vendor || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Vendor Part #</td>
                          <td className="py-2 text-sm text-gray-800">{product.vendorPart || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium text-gray-600">Customer Reference</td>
                          <td className="py-2 text-sm text-gray-800">{product.customerRef || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}




        {/* Status Section */}
        <div className="bg-gray-50 px-6 py-4 border-t rounded-lg border-gray-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <span className="text-sm text-gray-500">Last updated: {new Date().toLocaleString()}</span>
            </div>
            <div>
              {Number(product.quantity) <= Number(product.reorderPoint) && Number(product.reorderPoint) > 0 && (
                <div className="flex items-center text-amber-600">
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span className="text-sm font-medium">Low stock alert</span>
                </div>
              )}
            </div>
          </div>
        </div>


      </div>


    </div>
  );
};