"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { Package, Search, AlertCircle, Plus, RefreshCw } from "lucide-react";
import githubConfig from '../config/githubConfig';


const ReceiveProducts = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [bin, setBin] = useState("");
  const [qtyToAdd, setQtyToAdd] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [allProducts, setAllProducts] = useState([]);
  const suggestionRef = useRef(null);
  const productsData = [];
  const generateFileName = (product) => {
    const sanitizedManufacturerPart = product.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
    const sanitizedPartName = product.partName.replace(/[^a-z0-9():]/gi, "_").replace(/\s+/g, "_");
    return `${product.id}-${sanitizedPartName}-${sanitizedManufacturerPart}.json`;
  };
  // Load all products once for suggestions
  useEffect(() => {
    const loadAllProducts = async () => {
      try {
        // First try to get from localStorage
        // const localItems = localStorage.getItem('inventoryItems');
        // if (localItems) {
        //   setAllProducts(JSON.parse(localItems));
        //   return;
        // }
        // If GitHub config is valid, load from there
        const { token, repo, owner, path } = githubConfig;
        if (token && repo && owner) {
          const jsonDirPath = `${path}/jsons`;
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;

          const response = await fetch(apiUrl, {
            headers: {
              "Authorization": `token ${token}`
            }
          });

          if (response.ok) {
            const files = await response.json();
            const productsData = [];

            for (const file of files) {
              if (file.type === "file" && file.name.endsWith(".json")) {
                try {
                  const fileResponse = await fetch(file.download_url);
                  if (fileResponse.ok) {
                    const fileContent = await fileResponse.json();
                    productsData.push(fileContent);
                  }
                } catch (error) {
                  console.error("Error loading product:", error);
                }
              }
            }

            if (productsData.length > 0) {
              setAllProducts(productsData);
            }
          }
        }
      } catch (error) {
        console.error("Error loading products for suggestions:", error);
      }
    };

    loadAllProducts();
  }, []);

  // Enhance the click-outside effect
  useEffect(() => {
    function handleClickOutside(event) {
      // Make sure we're not in the search input or the suggestions dropdown
      if (
        suggestionRef.current &&
        !suggestionRef.current.contains(event.target) &&
        !event.target.closest('input[type="text"]') // Don't close when clicking the input
      ) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Update the suggestions effect to be more strict about when to show

  useEffect(() => {
    if (searchQuery.trim()) {
      const filtered = allProducts.filter(product => {
        const manufacturerPart = product.manufacturerPart?.toLowerCase() || '';
        const partName = product.partName?.toLowerCase() || '';
        const query = searchQuery.toLowerCase();

        return manufacturerPart.includes(query) || partName.includes(query);
      });

      setSuggestions(filtered.slice(0, 10)); // Limit to 10 suggestions
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchQuery, allProducts]);

  // Function to search for products by manufacturerPart
  const searchProducts = async (e) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setIsLoading(true);
    setError(null);
    setProduct(null);
    setSuccessMessage("");
    setShowSuggestions(false);

    try {
      const { token, repo, owner, path } = githubConfig;
      if (!token || !repo || !owner) {
        setError("GitHub config is incomplete");
        setIsLoading(false);
        return;
      }

      // Find the product in allProducts first
      const matchingProduct = allProducts.find(p =>
        p.manufacturerPart.toLowerCase() === searchQuery.toLowerCase() ||
        p.partName.toLowerCase() === searchQuery.toLowerCase()
      );

      if (!matchingProduct) {
        setError("Product not found");
        setIsLoading(false);
        return;
      }

      // Use the same file naming convention
      const fileName = generateFileName(matchingProduct);
      const jsonDirPath = path ? `${path}/jsons` : 'jsons';
      const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}/${fileName}`;

      console.log("Fetching file:", fileUrl);

      const response = await fetch(fileUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText} (${response.status})`);
      }

      const fileData = await response.json();
      const fileResponse = await fetch(fileData.download_url);

      if (fileResponse.ok) {
        const fileContent = await fileResponse.json();
        setProduct(fileContent);
        setQtyToAdd("");
      } else {
        throw new Error("Error loading product details");
      }

    } catch (error) {
      console.error("Error searching for product:", error);
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // Function to handle suggestion click
  const handleSuggestionClick = (suggestion) => {
    setSearchQuery(suggestion.manufacturerPart);
    setShowSuggestions(false);

    // Set the product directly without API call since we already have the data
    setProduct(suggestion);
    setQtyToAdd("");
    setBin("");
    setError(null);
    setSuccessMessage("");
  };

  // Function to add product to inventory
  const addToInventory = async () => {
    if (!product || !qtyToAdd || !bin) return;
    setShowSuggestions(false);
    setIsAdding(true);
    setError(null);
    setSuccessMessage("");

    try {
      const { token, repo, owner, path } = githubConfig;
      if (!token || !repo || !owner) {
        throw new Error("GitHub configuration is incomplete");
      }

      const qtyToAddNum = parseInt(qtyToAdd);
      const existingBins = product.binLocations || [];
      const totalQty = parseInt(product.avl_quantity || "0");

      // Create updated product data
      const binIndex = existingBins.findIndex(b => b.bin === bin);
      const updatedBins = binIndex >= 0
        ? existingBins.map((b, i) =>
          i === binIndex
            ? { ...b, quantity: parseInt(b.quantity) + qtyToAddNum }
            : b
        )
        : [...existingBins, { bin: bin, quantity: qtyToAddNum }];

      const updatedProduct = {
        ...product,
        binLocations: updatedBins,
        avl_quantity: (totalQty + qtyToAddNum).toString()
      };

      try {

        const fileName = generateFileName(product);
        const jsonDirPath = path ? `${path}/jsons` : 'jsons';
        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}/${fileName}`;

        console.log("Attempting to update file:", fileUrl);
        console.log("Debug info:", {
          product,
          fileName: generateFileName(product),
          path: jsonDirPath,
          fullUrl: fileUrl
        });
        // Get existing file to get its SHA
        const fileResponse = await fetch(fileUrl, {
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json"
          }
        });

        if (!fileResponse.ok) {
          throw new Error(`GitHub API error: ${fileResponse.status} - ${fileResponse.statusText}`);
        }

        const fileData = await fileResponse.json();
        const content = Buffer.from(JSON.stringify(updatedProduct, null, 2)).toString('base64');

        // Update the file
        const updateResponse = await fetch(fileUrl, {
          method: 'PUT',
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json",
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            message: `Update inventory for ${product.manufacturerPart}`,
            content: content,
            sha: fileData.sha
          })
        });

        if (!updateResponse.ok) {
          const errorData = await updateResponse.json();
          throw new Error(`Failed to update file: ${errorData.message}`);
        }
        if (updateResponse.ok) {
      // Dispatch a custom event
      const event = new CustomEvent('inventoryUpdated', {
        detail: { timestamp: Date.now() }
      });
      window.dispatchEvent(event);
      
      setSuccessMessage(`Successfully added ${qtyToAdd} units`);
    }
        

        // Update local state
        setProduct(updatedProduct);
        setSuccessMessage(`Successfully added ${qtyToAdd} units to bin ${bin}. New total: ${updatedProduct.avl_quantity}`);

        // Update suggestions list
        setAllProducts(prevProducts => {
          const updatedProducts = [...prevProducts];
          const index = updatedProducts.findIndex(p =>
            p.manufacturerPart === product.manufacturerPart
          );
          if (index !== -1) {
            updatedProducts[index] = updatedProduct;
          }
          return updatedProducts;
        });

        // Reset form
        setBin("");
        setQtyToAdd("");

      } catch (githubError) {
        console.error("GitHub API Error:", githubError);
        throw new Error(`GitHub API Error: ${githubError.message}`);
      }
      

    } catch (error) {
      console.error("Error adding to inventory:", error);
      setError(`Error adding to inventory: ${error.message}`);
    } finally {
      setIsAdding(false);
    }
  };
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      {/* Header */}

      {/* Main Content - Flex-grow to fill available space */}
      <main className="flex-grow">
        {/* Search Section */}
        <div className="p-6 bg-gray-50 border-b border-gray-200">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-lg font-semibold mb-4">Enter Manufacturer Part Number or Part Name</h2>
            <form onSubmit={searchProducts} className="flex relative">
              <div className="flex-grow relative">
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => {
                    setSearchQuery(e.target.value);
                    // Show suggestions immediately when typing
                    if (e.target.value) {
                      setShowSuggestions(true);
                    }
                  }}
                  onFocus={() => {
                    // Show suggestions when input is focused and has value
                    if (searchQuery) {
                      setShowSuggestions(true);
                    }
                  }}
                  placeholder="Enter manufacturer part number or part name"
                  className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  autoComplete="off"
                />
                {showSuggestions && suggestions.length > 0 && (
                  <div
                    ref={suggestionRef}
                    className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto"
                  >
                    {suggestions.map((suggestion, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                        onClick={() => handleSuggestionClick(suggestion)}
                      >
                        <div className="font-medium">{suggestion.manufacturerPart}</div>
                        {suggestion.partName && (
                          <div className="text-sm text-gray-600">{suggestion.partName}</div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="submit"
                className="bg-blue-600 text-white px-4 py-2 rounded-r-md hover:bg-blue-700 flex items-center"
                disabled={isLoading}
              >
                {isLoading ? (
                  <RefreshCw className="w-5 h-5 animate-spin" />
                ) : (
                  <Search className="w-5 h-5" />
                )}
                <span className="ml-2">Search</span>
              </button>
              <button
                type="button"
                onClick={async () => {
                  // Clear localStorage
                  // localStorage.removeItem('inventoryItems');
                  // Force reload from GitHub
                  const loadAllProducts = async () => {
                    // ... copy the same loadAllProducts function logic here
                  };
                  await loadAllProducts();
                  // Show confirmation
                  setSuccessMessage("Products refreshed from GitHub");
                }}
                className="ml-2 px-3 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                <RefreshCw className="w-4 h-4" />
              </button>
            </form>

          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-red-50 border-b border-red-100 mx-auto max-w-3xl">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
              <p className="text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Success Message */}
        {successMessage && (
          <div className="p-4 bg-green-50 border-b border-green-100 mx-auto max-w-3xl">
            <div className="flex items-start">
              <AlertCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
              <p className="text-green-700">{successMessage}</p>
            </div>
          </div>
        )}

        {/* Product Details */}
        {product && (
          <div className="p-6 max-w-3xl mx-auto">
            <div className="bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="bg-blue-50 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-blue-800">Product Detail - {product.id || "Not specified"}</h3>
              </div>

              <div className="p-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <table className="min-w-full">
                      <tbody>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Part Name</td>
                          <td className="py-2 text-sm text-gray-800">{product.partName || "Not specified"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Manufacturer</td>
                          <td className="py-2 text-sm text-gray-800">{product.manufacturer || "Not specified"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Manufacturer Part#</td>
                          <td className="py-2 text-sm text-gray-800">{product.manufacturerPart || "Not specified"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Vendor</td>
                          <td className="py-2 text-sm text-gray-800">{product.vendor || "Not specified"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Vendor Part#</td>
                          <td className="py-2 text-sm text-gray-800">{product.vendorPart || "Not specified"}</td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Description</td>
                          <td className="py-2 text-sm text-gray-800">{product.description || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>

                  <div>
                    <table className="min-w-full">
                      <tbody>

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
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Bin Locations</td>
                          <td className="py-2 text-sm text-gray-800">
                            <div className="space-y-1">
                              {product.binLocations && product.binLocations.length > 0 ? (
                                product.binLocations.map((location, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className="font-medium">{location.bin}:</span>
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {location.quantity}
                                    </span>
                                  </div>
                                ))
                              ) : (
                                "No bins assigned"
                              )}
                            </div>
                          </td>
                        </tr>
                        <tr className="border-b border-gray-100">
                          <td className="py-2 text-sm font-medium text-gray-600">Available Quantity</td>
                          <td className="py-2 text-sm text-gray-800">
                            <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${Number(product.avl_quantity) > 0 ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                              }`}>
                              {product.avl_quantity || "0"}
                            </span>
                          </td>
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
                </div>
              </div>
            </div>

            {/* Add to Inventory Form */}
            <div className="mt-6 bg-white border border-gray-200 rounded-md overflow-hidden shadow-sm">
              <div className="bg-green-50 p-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-green-800">Add to Inventory</h3>
              </div>

              <div className="p-4">
                <form onSubmit={(e) => { e.preventDefault(); addToInventory(); }} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
                      <input
                        type="text"
                        value={bin}
                        onChange={(e) => setBin(e.target.value)}
                        placeholder={product.bin || "Enter bin location"}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Quantity to Add</label>
                      <input
                        type="number"
                        value={qtyToAdd}
                        onChange={(e) => setQtyToAdd(e.target.value)}
                        min="1"
                        required
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={() => {
                        setProduct(null);
                        setSearchQuery("");
                        setBin("");
                        setQtyToAdd("");
                        setSuccessMessage("");
                        setShowSuggestions(false); // Explicitly hide suggestions

                      }}
                      className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                      Clear
                    </button>

                    <button
                      type="submit"
                      onClick={() => setShowSuggestions(false)} // Hide suggestions when clicking search

                      className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 flex items-center"
                      disabled={isAdding || !qtyToAdd}
                    >
                      {isAdding ? (
                        <>
                          <RefreshCw className="w-4 h-4 mr-2 animate-spin" /> Processing...
                        </>
                      ) : (
                        <>
                          <Plus className="w-4 h-4 mr-2" /> Add to Inventory
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </div>
        )}

        {/* Empty state to ensure content fills space when no product is displayed */}
        {!product && !isLoading && (
          <div className="flex-grow flex items-center justify-center p-12 bg-white border border-dashed border-gray-300 rounded-md m-6 max-w-3xl mx-auto">
            <div className="text-center">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No product selected</h3>
              <p className="mt-1 text-sm text-gray-500">
                Search for a product using the search bar above
              </p>
            </div>
          </div>
        )}
      </main>

      {/* Footer Navigation Links */}
      <footer className="mt-auto bg-white p-4 border-t border-gray-200">
        <div className="flex justify-center space-x-4">
          <Link href="/" className="text-blue-600 hover:text-blue-800 hover:underline">
            Dashboard
          </Link>
          <Link href="/manage-inventory" className="text-blue-600 hover:text-blue-800 hover:underline">
            Manage Inventory
          </Link>
        </div>
      </footer>
    </div>
  );

};

export default ReceiveProducts;