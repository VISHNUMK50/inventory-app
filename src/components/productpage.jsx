"use client";
import { useState, useEffect } from "react";
import { use } from "react"; // Import React.use
import Link from "next/link";
import { ArrowLeft, Save, Package, RefreshCw, Edit, Trash, AlertCircle, ClipboardList, Home } from "lucide-react";
import githubConfig from '../config/githubConfig';

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
            // Fall back to sample data
            const sampleProduct = sampleProducts.find(item => item.manufacturerPart === partNum);
            if (sampleProduct) {
              setProduct(sampleProduct);
              setEditedProduct(sampleProduct);
            } else {
              setError("Product not found");
            }
          }
        } else {
          // Check sample data
          const sampleProduct = sampleProducts.find(item => item.manufacturerPart === partNum);
          if (sampleProduct) {
            setProduct(sampleProduct);
            setEditedProduct(sampleProduct);
          } else {
            setError("Product not found");
          }
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
          const sampleProduct = sampleProducts.find(item => item.manufacturerPart === partNum);
          if (sampleProduct) {
            setProduct(sampleProduct);
            setEditedProduct(sampleProduct);
          } else {
            setError("Product not found");
          }
        }
      }
    } catch (error) {
      console.error("Error fetching product:", error);
      setError(error.message);
      
      // Try sample data as fallback
      const sampleProduct = sampleProducts.find(item => item.manufacturerPart === partNum);
      if (sampleProduct) {
        setProduct(sampleProduct);
        setEditedProduct(sampleProduct);
      }
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
  
  // Sample product data for testing
  const sampleProducts = [
    {
      image: "",
      datasheet: "https://example.com/datasheets/jst-connectors.pdf",
      manufacturer: "HUBTRONICS",
      manufacturerPart: "JST-XH 2.54mm Female-Female 2 Pin 25cm Wire",
      vendor: "Amazon",
      vendorPart: "AMZN-1234",
      customerRef: "CONN-001",
      description: "XH2515 JST-XH 2.54mm Female-Female 2 Pin Reverse Proof Connector 25cm Wire",
      bin: "5",
      quantity: "5",
      reorderPoint: "2",
      reorderQty: "10",
      costPrice: "2.99",
      salePrice: "4.99",
      category: "Connector",
      partName: "JST-Connector"
    },
    {
      image: "",
      datasheet: "https://example.com/datasheets/0603-led.pdf",
      manufacturer: "HUBTRONICS",
      manufacturerPart: "0603 Red Led",
      vendor: "DigiKey",
      vendorPart: "DK-5678",
      customerRef: "LED-001",
      description: "19-21SURC/S530-A3/TR8 0603 Red SMD Led (Pack of 10)",
      bin: "20",
      quantity: "20",
      reorderPoint: "5",
      reorderQty: "15",
      costPrice: "1.49",
      salePrice: "2.99",
      category: "LED",
      partName: "Red-LED"
    },
    {
      image: "",
      datasheet: "",
      manufacturer: "AFS",
      manufacturerPart: "ASF",
      vendor: "",
      vendorPart: "",
      customerRef: "",
      description: "",
      bin: "",
      quantity: "32",
      reorderPoint: "",
      reorderQty: "",
      costPrice: "",
      salePrice: "",
      category: "IC",
      partName: "AFSS"
    }
  ];

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
      <div className="p-6">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h1 className="text-2xl font-bold text-gray-800">
            {product && (product.partName || product.manufacturerPart || "Unknown Product")}
          </h1>
          <p className="text-gray-600">
            {product && (product.description || "No description available")}
          </p>
        </div>
        
        {/* Product Details Section */}
        <div className="p-6">
          {editMode ? (
            /* Edit Form */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Basic Information</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Part Name</label>
                    <input
                      type="text"
                      name="partName"
                      value={editedProduct.partName || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer Part</label>
                    <input
                      type="text"
                      name="manufacturerPart"
                      value={editedProduct.manufacturerPart || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={editedProduct.manufacturer || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      name="description"
                      value={editedProduct.description || ""}
                      onChange={handleInputChange}
                      rows="3"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    ></textarea>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                    <input
                      type="text"
                      name="category"
                      value={editedProduct.category || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Inventory Details</h2>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity in Stock</label>
                    <input
                      type="number"
                      name="quantity"
                      value={editedProduct.quantity || "0"}
                      onChange={handleInputChange}
                      min="0"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
                    <input
                      type="text"
                      name="bin"
                      value={editedProduct.bin || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Point</label>
                    <input
                      type="text"
                      name="reorderPoint"
                      value={editedProduct.reorderPoint || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Reorder Quantity</label>
                    <input
                      type="text"
                      name="reorderQty"
                      value={editedProduct.reorderQty || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
              
              <div className="md:col-span-2">
                <h2 className="text-lg font-semibold mb-4 text-gray-700">Pricing & References</h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <input
                      type="text"
                      name="costPrice"
                      value={editedProduct.costPrice || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <input
                      type="text"
                      name="salePrice"
                      value={editedProduct.salePrice || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                    <input
                      type="text"
                      name="vendor"
                      value={editedProduct.vendor || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Part #</label>
                    <input
                      type="text"
                      name="vendorPart"
                      value={editedProduct.vendorPart || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Customer Reference</label>
                    <input
                      type="text"
                      name="customerRef"
                      value={editedProduct.customerRef || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Datasheet URL</label>
                    <input
                      type="text"
                      name="datasheet"
                      value={editedProduct.datasheet || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
              </div>
            </div>
          ) : (
            /* View Mode */
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                  <ClipboardList className="h-5 w-5 mr-2 text-blue-600" /> Basic Information
                </h2>
                
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Part Name</td>
                      <td className="py-2 text-sm text-gray-800">{product.partName || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Manufacturer Part</td>
                      <td className="py-2 text-sm text-gray-800">{product.manufacturerPart || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Manufacturer</td>
                      <td className="py-2 text-sm text-gray-800">{product.manufacturer || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Description</td>
                      <td className="py-2 text-sm text-gray-800">{product.description || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Category</td>
                      <td className="py-2 text-sm text-gray-800">
                        {product.category ? (
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                            {product.category}
                          </span>
                        ) : (
                          "Not specified"
                        )}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
              
              <div>
                <h2 className="text-lg font-semibold mb-4 text-gray-700 flex items-center">
                  <Package className="h-5 w-5 mr-2 text-blue-600" /> Inventory Details
                </h2>
                
                <table className="min-w-full">
                  <tbody>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Quantity in Stock</td>
                      <td className="py-2 text-sm text-gray-800">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          Number(product.quantity) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {product.quantity || "0"}
                        </span>
                      </td>
                    </tr>
                    <tr className="border-b border-gray-100">
                      <td className="py-2 text-sm font-medium text-gray-600">Bin Location</td>
                      <td className="py-2 text-sm text-gray-800">{product.bin || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                        <td className="py-2 text-sm font-medium text-gray-600">Reorder Point</td>
                        <td className="py-2 text-sm text-gray-800">{product.reorderPoint || "Not specified"}</td>
                    </tr>
                    <tr className="border-b border-gray-100">
                        <td className="py-2 text-sm font-medium text-gray-600">Reorder Quantity</td>
                        <td className="py-2 text-sm text-gray-800">{product.reorderQty || "Not specified"}</td>
                      </tr>
                    </tbody>
                  </table>
                </div>
                  {/* 8888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888888 */}
                  {/* Additional Information Section */}
                  <div className="md:col-span-2">
                    <h2 className="text-lg font-semibold mb-4 text-gray-700">Pricing & References</h2>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <h3 className="text-md font-medium mb-2 text-gray-700">Pricing</h3>
                        <table className="min-w-full">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Cost Price</td>
                              <td className="py-2 text-sm text-gray-800">
                                {product.costPrice ? `$${product.costPrice}` : "Not specified"}
                              </td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Sale Price</td>
                              <td className="py-2 text-sm text-gray-800">
                                {product.salePrice ? `$${product.salePrice}` : "Not specified"}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
    
                      <div>
                        <h3 className="text-md font-medium mb-2 text-gray-700">References</h3>
                        <table className="min-w-full">
                          <tbody>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Vendor</td>
                              <td className="py-2 text-sm text-gray-800">{product.vendor || "Not specified"}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Vendor Part #</td>
                              <td className="py-2 text-sm text-gray-800">{product.vendorPart || "Not specified"}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Customer Reference</td>
                              <td className="py-2 text-sm text-gray-800">{product.customerRef || "Not specified"}</td>
                            </tr>
                            <tr className="border-b border-gray-100">
                              <td className="py-2 text-sm font-medium text-gray-600">Datasheet</td>
                              <td className="py-2 text-sm text-gray-800">
                                {product.datasheet ? (
                                  <a 
                                    href={product.datasheet} 
                                    target="_blank" 
                                    rel="noopener noreferrer" 
                                    className="text-blue-600 hover:text-blue-800 hover:underline"
                                  >
                                    View Datasheet
                                  </a>
                                ) : (
                                  "Not available"
                                )}
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>


                    </div>
                  </div>
                </div>
              )}
              </div>
    



            {/* Status Section */}
            <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
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