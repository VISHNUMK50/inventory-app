"use client";
import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
    Package, Search, AlertCircle, Plus, RefreshCw,
    ShoppingCart, Download, Save, Trash2, Calendar, User
} from "lucide-react";
import githubConfig from '../config/githubConfig';
import Header from "@/components/Header";
import jsPDF from "jspdf";
import "jspdf-autotable";
const OrderCheckout = () => {
    // State for form fields
    const [customerName, setCustomerName] = useState("");
    const [purpose, setPurpose] = useState("");
    const [description, setDescription] = useState("");
    const [currentDate, setCurrentDate] = useState("");
    const [showActualPrice, setShowActualPrice] = useState(false);

    // State for products
    const [searchQuery, setSearchQuery] = useState("");
    const [product, setProduct] = useState(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState(null);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [qty, setQty] = useState(1);

    // State for suggestions and customers
    const [suggestions, setSuggestions] = useState([]);
    const [showSuggestions, setShowSuggestions] = useState(false);
    const [allProducts, setAllProducts] = useState([]);
    const [customerSuggestions, setCustomerSuggestions] = useState([]);
    const [showCustomerSuggestions, setShowCustomerSuggestions] = useState(false);
    const [successMessage, setSuccessMessage] = useState("");

    const suggestionRef = useRef(null);
    const customerSuggestionRef = useRef(null);

    // Load saved customers and products on component mount
    useEffect(() => {
        // Set current date in YYYY-MM-DD format
        const now = new Date();
        const year = now.getFullYear();
        const month = String(now.getMonth() + 1).padStart(2, '0');
        const day = String(now.getDate()).padStart(2, '0');
        setCurrentDate(`${year}-${month}-${day}`);

        // Load products
        loadAllProducts();
    }, []);

    useEffect(() => {
        if (customerName.length > 0 && document.activeElement === document.querySelector('#customerNameInput')) {
            const filtered = customerSuggestions.filter(customer =>
                customer.toLowerCase().includes(customerName.toLowerCase())
            );
            setShowCustomerSuggestions(filtered.length > 0);
        } else {
            setShowCustomerSuggestions(false);
        }
    }, [customerName, customerSuggestions]);
    // Load all products for search suggestions
    const loadAllProducts = async () => {
        try {
            setIsLoading(true);
            // Only load from GitHub
            const { token, repo, owner, path } = githubConfig;
            console.log("GitHub config:", { repo, owner, path, tokenExists: !!token });

            if (!token || !repo || !owner) {
                console.error("Missing GitHub configuration");
                setError("GitHub configuration incomplete");
                return;
            }

            const jsonDirPath = `${path}/jsons`;
            const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
            console.log("Fetching from GitHub URL:", apiUrl);

            const response = await fetch(apiUrl, {
                headers: {
                    "Authorization": `token ${token}`
                }
            });

            console.log("GitHub API response status:", response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error("GitHub API error:", response.status, errorText);
                setError(`GitHub API error: ${response.status}`);
                return;
            }

            const files = await response.json();
            console.log("Found files:", files.length);

            const productsData = [];

            for (const file of files) {
                if (file.type === "file" && file.name.endsWith(".json")) {
                    try {
                        console.log("Fetching file:", file.name, file.download_url);
                        const fileResponse = await fetch(file.download_url);
                        if (fileResponse.ok) {
                            const fileContent = await fileResponse.json();
                            productsData.push(fileContent);
                        } else {
                            console.error("Error fetching file:", file.name, fileResponse.status);
                        }
                    } catch (error) {
                        console.error("Error loading product file:", file.name, error);
                    }
                }
            }

            console.log("Loaded products:", productsData.length);
            if (productsData.length > 0) {
                setAllProducts(productsData);
            } else {
                setError("No products found in GitHub repository");
            }
        } catch (error) {
            console.error("Error loading products:", error);
            setError(`Failed to load products: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle clicks outside of suggestion dropdowns
    useEffect(() => {
        function handleClickOutside(event) {
            if (
                suggestionRef.current &&
                !suggestionRef.current.contains(event.target) &&
                !event.target.closest('#productSearch')
            ) {
                setShowSuggestions(false);
            }

            if (
                customerSuggestionRef.current &&
                !customerSuggestionRef.current.contains(event.target) &&
                !event.target.closest('#customerNameInput')
            ) {
                setShowCustomerSuggestions(false);
            }
        }

        document.addEventListener("mousedown", handleClickOutside);
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, []);

    // Handle product suggestions filtering
    useEffect(() => {
        if (searchQuery.length > 0 && document.activeElement === document.querySelector('#productSearch')) {
            const filtered = allProducts.filter(product => {
                const manufacturerPart = product.manufacturerPart?.toLowerCase() || '';
                const partName = product.partName?.toLowerCase() || '';
                const query = searchQuery.toLowerCase();

                return manufacturerPart.includes(query) || partName.includes(query);
            });

            setSuggestions(filtered.slice(0, 10));
            setShowSuggestions(filtered.length > 0);
        } else {
            setShowSuggestions(false);
        }
    }, [searchQuery, allProducts]);

    // Handle customer name suggestions
    useEffect(() => {
        if (customerName.length > 0 && document.activeElement === document.querySelector('#customerNameInput')) {
            const filtered = customerSuggestions.filter(customer =>
                customer.toLowerCase().includes(customerName.toLowerCase())
            );
            setShowCustomerSuggestions(filtered.length > 0);
        } else {
            setShowCustomerSuggestions(false);
        }
    }, [customerName, customerSuggestions]);

    // Function to search for products
    const searchProducts = async (e) => {
        e.preventDefault();
        if (!searchQuery.trim()) return;

        setIsLoading(true);
        setError(null);
        setProduct(null);
        setShowSuggestions(false);

        try {
            // Find product in allProducts
            const foundProduct = allProducts.find(item =>
                item.manufacturerPart?.toLowerCase() === searchQuery.toLowerCase() ||
                (item.partName && item.partName.toLowerCase() === searchQuery.toLowerCase())
            );

            if (foundProduct) {
                // Ensure price and salePrice are properly set
                const processedProduct = {
                    ...foundProduct,
                    costPrice: parseFloat(foundProduct.costPrice || 0),
                    salePrice: parseFloat(foundProduct.salePrice || 0)
                };
                setProduct(processedProduct);
                setQty(1);
            } else {
                setError("Product not found");
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
        setSearchQuery(suggestion.manufacturerPart || suggestion.partName);
        setShowSuggestions(false);
        setProduct(suggestion);
        setQty(1);
        setError(null);
    };

    // Function to handle customer suggestion click
    const handleCustomerSuggestionClick = (customer) => {
        setCustomerName(customer);
        setShowCustomerSuggestions(false);
    };

    // Function to add product to order
    const addProductToOrder = () => {
        if (!product) return;

        // Check if product already exists in order
        const existingProductIndex = selectedProducts.findIndex(p =>
            p.manufacturerPart === product.manufacturerPart
        );

        if (existingProductIndex !== -1) {
            // Update quantity if product already exists
            const updatedProducts = [...selectedProducts];
            updatedProducts[existingProductIndex].orderQty += parseInt(qty);
            setSelectedProducts(updatedProducts);
        } else {
            // Add new product to order
            const productToAdd = {
                ...product,
                orderQty: parseInt(qty),
                costPrice: parseFloat(product.costPrice || 0),
                salePrice: parseFloat(product.salePrice || 0),
            };
            setSelectedProducts([...selectedProducts, productToAdd]);
        }

        // Reset search
        setProduct(null);
        setSearchQuery("");
        setQty(1);
    };

    // Function to remove product from order
    const removeProductFromOrder = (index) => {
        const updatedProducts = [...selectedProducts];
        updatedProducts.splice(index, 1);
        setSelectedProducts(updatedProducts);
    };
    const updateProductQuantity = (index, newQty) => {
        if (newQty < 1) return; // Prevent quantities less than 1

        const updatedProducts = [...selectedProducts];
        updatedProducts[index].orderQty = newQty;
        setSelectedProducts(updatedProducts);
    };

    // Calculate totals
    const calculateTotals = () => {
        const priceTotal = selectedProducts.reduce(
            (total, product) => total + (parseFloat(product.costPrice) || 0) * product.orderQty,
            0
        );

        const salePriceTotal = selectedProducts.reduce(
            (total, product) => total + (parseFloat(product.salePrice) || 0) * product.orderQty,
            0
        );

        return { priceTotal, salePriceTotal };
    };

    // Function to save order to GitHub and update inventory
    const saveOrderToGitHub = async () => {
        if (selectedProducts.length === 0) {
            setError("Cannot save an empty order");
            return;
        }

        if (!customerName) {
            setError("Customer name is required");
            return;
        }

        setIsLoading(true);
        setError(null);
        setSuccessMessage("");

        try {
            // Create order object
            const { priceTotal, salePriceTotal } = calculateTotals();
            const order = {
                customerName,
                purpose,
                description,
                orderDate: currentDate,
                products: selectedProducts,
                showActualPrice,
                priceTotal,
                salePriceTotal,
                createdAt: new Date().toISOString()
            };

            // Save to GitHub if config is valid
            const { token, repo, owner, path } = githubConfig;
            if (!token || !repo || !owner) {
                throw new Error("GitHub configuration is incomplete");
            }

            // Save the order
            const ordersDirPath = `${path}/orders`;
            const orderFileName = `order_${Date.now()}_${customerName.replace(/\s+/g, '_')}.json`;
            const filePath = `${ordersDirPath}/${orderFileName}`;

            // Create file content
            const fileContent = JSON.stringify(order, null, 2);
            const encodedContent = btoa(unescape(encodeURIComponent(fileContent)));

            // Prepare request body
            const requestBody = {
                message: `New order for customer: ${customerName}`,
                content: encodedContent,
            };

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
                throw new Error(`GitHub save error: ${saveResponse.status} ${saveResponse.statusText}`);
            }

            // Update inventory for each product
            const jsonDirPath = `${path}/jsons`;
            for (const orderProduct of selectedProducts) {
                try {
                    console.log(`Updating inventory for: ${orderProduct.manufacturerPart}`);

                    const sanitizedManufacturerPart = orderProduct.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
                    const sanitizedPartName = orderProduct.partName.replace(/[^a-z0-9():]/gi, "_").replace(/\s+/g, "_");
                    const itemIdentifier = `${orderProduct.id}-${sanitizedPartName}-${sanitizedManufacturerPart}`;


                    // Find the product in allProducts to get its information
                    const productInInventory = allProducts.find(p => p.manufacturerPart === orderProduct.manufacturerPart);

                    if (productInInventory) {
                        // Get the file content from GitHub
                        const productFilePath = `${jsonDirPath}/${itemIdentifier}.json`;
                        const fileUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${productFilePath}`;

                        console.log(`Fetching product file: ${productFilePath}`);

                        const fileResponse = await fetch(fileUrl, {
                            headers: {
                                "Authorization": `token ${token}`
                            }
                        });

                        if (!fileResponse.ok) {
                            console.error(`Failed to fetch file for ${orderProduct.manufacturerPart}: ${fileResponse.status} ${fileResponse.statusText}`);
                            continue; // Skip to next product if we can't fetch this one
                        }

                        const fileData = await fileResponse.json();

                        // Decode content from Base64
                        const decodedContent = atob(fileData.content);
                        const content = JSON.parse(decodedContent);

                        console.log(`Current quantity for ${orderProduct.manufacturerPart}: ${content.quantity}`);

                        // Calculate new quantity
                        const currentQty = parseInt(content.quantity) || 0;
                        const orderQty = parseInt(orderProduct.orderQty) || 0;
                        const newQuantity = Math.max(0, currentQty - orderQty);

                        console.log(`New quantity will be: ${newQuantity} (${currentQty} - ${orderQty})`);

                        // Update quantity in the product data
                        content.quantity = newQuantity.toString();

                        // Encode the updated content
                        const updatedContent = btoa(unescape(encodeURIComponent(JSON.stringify(content, null, 2))));

                        // Prepare update request
                        const updateBody = {
                            message: `Update inventory after order for ${customerName}`,
                            content: updatedContent,
                            sha: fileData.sha // Required to update an existing file
                        };

                        console.log(`Updating ${orderProduct.manufacturerPart} in GitHub...`);

                        // Send update request
                        const updateResponse = await fetch(fileUrl, {
                            method: 'PUT',
                            headers: {
                                "Authorization": `token ${token}`,
                                "Content-Type": "application/json"
                            },
                            body: JSON.stringify(updateBody)
                        });

                        if (!updateResponse.ok) {
                            const errorData = await updateResponse.text();
                            console.error(`Failed to update inventory for ${orderProduct.manufacturerPart}:`, updateResponse.status, errorData);
                        } else {
                            console.log(`Successfully updated inventory for ${orderProduct.manufacturerPart}`);
                        }
                    } else {
                        console.error(`Product not found in inventory: ${orderProduct.manufacturerPart}`);
                    }
                } catch (error) {
                    console.error(`Error updating inventory for ${orderProduct.manufacturerPart}:`, error);
                }
            }

            setSuccessMessage("Order saved successfully and inventory updated");

            // Generate and download PDF
            generatePDF(order);

            // Clear form after successful save
            clearForm();

            // Refresh product list to show updated inventory
            loadAllProducts();
        } catch (error) {
            console.error("Error saving order:", error);
            setError(`Error saving order: ${error.message}`);
        } finally {
            setIsLoading(false);
        }
    };

    // Update the generatePDF function in your OrderCheckout.js file

    const generatePDF = async (order) => {
        try {
            const response = await fetch('@/app/api/generate-pdf', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(order),
            });

            if (!response.ok) {
                throw new Error('PDF generation failed');
            }

            // Get the PDF blob
            const blob = await response.blob();

            // Create object URL
            const url = window.URL.createObjectURL(blob);

            // Create link and trigger download
            const a = document.createElement('a');
            a.href = url;
            a.download = `Order_${order.customerName.replace(/\s+/g, '_')}_${order.orderDate}.pdf`;
            document.body.appendChild(a);
            a.click();

            // Clean up
            window.URL.revokeObjectURL(url);
            document.body.removeChild(a);
        } catch (error) {
            console.error('PDF generation error:', error);
            alert('Failed to generate PDF. Please try again.');
        }
    };
    // Clear form after submission
    const clearForm = () => {
        setCustomerName("");
        setPurpose("");
        setDescription("");
        setShowActualPrice(false);
        setSelectedProducts([]);
        setProduct(null);
        setSearchQuery("");
        setQty(1);
    };

    const { priceTotal, salePriceTotal } = calculateTotals();

    return (
        <div className="flex flex-col min-h-screen bg-gray-100">
            {/* Header */}
            <Header title="Create Order / Checkout" />

            {/* Main Content */}
            <main className="flex-grow p-6">
                <div className="max-w-6xl mx-auto">
                    {/* Customer and Order Details Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                            <User className="w-5 h-5 mr-2" /> Customer Information
                        </h2>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Customer Name with Dropdown */}
                            <div className="relative">
                                <label htmlFor="customerNameInput" className="block text-sm font-medium text-gray-700 mb-1">
                                    Customer Name *
                                </label>
                                <input
                                    id="customerNameInput"
                                    type="text"
                                    value={customerName}
                                    onChange={(e) => setCustomerName(e.target.value)}
                                    onFocus={() => customerName.length > 0 && customerSuggestions.length > 0 && setShowCustomerSuggestions(true)}
                                    placeholder="Enter customer name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    required
                                />
                                { showCustomerSuggestions && (
                                    <div
                                        ref={customerSuggestionRef}
                                        className="absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-40 overflow-y-auto"
                                    >
                                        {customerSuggestions
                                            .filter(customer => customer.toLowerCase().includes(customerName.toLowerCase()))
                                            .map((customer, index) => (
                                                <div
                                                    key={index}
                                                    className="px-4 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0"
                                                    onClick={() => handleCustomerSuggestionClick(customer)}
                                                >
                                                    {customer}
                                                </div>
                                            ))}
                                    </div>
                                )}

                            </div>

                            {/* Date Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Date
                                </label>
                                <div className="relative">
                                    <input
                                        type="date"
                                        value={currentDate}
                                        onChange={(e) => setCurrentDate(e.target.value)}
                                        className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {/* Purpose Field */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Purpose
                                </label>
                                <input
                                    type="text"
                                    value={purpose}
                                    onChange={(e) => setPurpose(e.target.value)}
                                    placeholder="Purpose of order"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>

                            {/* Show Actual Price Checkbox */}
                            <div className="flex items-center h-full pt-6">
                                <input
                                    type="checkbox"
                                    id="showPrice"
                                    checked={showActualPrice}
                                    onChange={(e) => setShowActualPrice(e.target.checked)}
                                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                                />
                                <label htmlFor="showPrice" className="ml-2 block text-sm text-gray-700">
                                    Show Actual Price in Order
                                </label>
                            </div>
                        </div>

                        {/* Description Field */}
                        <div className="mt-4">
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                Description
                            </label>
                            <textarea
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                                placeholder="Additional order details or notes"
                                rows={3}
                                className="w-full px-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>
                    </div>

                    {/* Product Search Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                            <Package className="w-5 h-5 mr-2" /> Add Products
                        </h2>

                        <form onSubmit={searchProducts} className="flex mb-4 relative">
                            <div className="flex-grow relative">
                                <input
                                    id="productSearch"
                                    type="text"
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    onFocus={() => searchQuery.length > 0 && suggestions.length > 0 && setShowSuggestions(true)}
                                    placeholder="Search by part number or name"
                                    className="w-full px-4 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    autoComplete="off"
                                />
                                {showSuggestions && (
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
                        </form>

                        {/* Error Message */}
                        {error && (
                            <div className="p-3 mb-4 bg-red-50 border border-red-100 rounded-md">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-red-500 mr-2 mt-0.5" />
                                    <p className="text-red-700">{error}</p>
                                </div>
                            </div>
                        )}

                        {/* Success Message */}
                        {successMessage && (
                            <div className="p-3 mb-4 bg-green-50 border border-green-100 rounded-md">
                                <div className="flex items-start">
                                    <AlertCircle className="w-5 h-5 text-green-500 mr-2 mt-0.5" />
                                    <p className="text-green-700">{successMessage}</p>
                                </div>
                            </div>
                        )}

                        {/* Selected Product Details */}
                        {product && (
                            <div className="border border-gray-200 rounded-md p-4 mt-4">
                                <div className="flex flex-col md:flex-row justify-between">
                                    <div className="flex-grow mb-4 md:mb-0">
                                        <h3 className="font-semibold text-lg">{product.partName || product.manufacturerPart}</h3>
                                        <div className="mt-2 grid grid-cols-1 md:grid-cols-3 gap-4">
                                            <div>
                                                <p className="text-sm text-gray-600">Manufacturer Part:</p>
                                                <p className="font-medium">{product.manufacturerPart || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Category:</p>
                                                <p className="font-medium">{product.category || "N/A"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Current Stock:</p>
                                                <p className="font-medium">{product.quantity || "0"}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Price:</p>
                                                <p className="font-medium">${parseFloat(product.costPrice || 0).toFixed(2)}</p>
                                            </div>
                                            <div>
                                                <p className="text-sm text-gray-600">Sale Price:</p>
                                                <p className="font-medium">${parseFloat(product.salePrice || 0).toFixed(2)}</p>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-end">
                                        <div className="mr-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Quantity
                                            </label>
                                            <input
                                                type="number"
                                                value={qty}
                                                onChange={(e) => setQty(Math.max(1, parseInt(e.target.value) || 1))}
                                                min="1"
                                                className="w-20 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                            />
                                        </div>

                                        <button
                                            type="button"
                                            onClick={addProductToOrder}
                                            className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 flex items-center"
                                        >
                                            <Plus className="w-4 h-4 mr-2" /> Add
                                        </button>
                                    </div>
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Order Summary Section */}
                    <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
                        <h2 className="text-xl font-semibold mb-4 text-gray-800 flex items-center">
                            <ShoppingCart className="w-5 h-5 mr-2" /> Order Summary
                        </h2>

                        {selectedProducts.length > 0 ? (
                            <>
                                <div className="overflow-x-auto">
                                    <table className="min-w-full divide-y divide-gray-200">
                                        <thead className="bg-gray-50">
                                            <tr>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Part Name
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Category
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Qty
                                                </th>
                                                {showActualPrice && (
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Price
                                                    </th>
                                                )}
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Sale Price
                                                </th>
                                                {showActualPrice && (
                                                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                        Total
                                                    </th>
                                                )}
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Sale Total
                                                </th>
                                                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                                    Actions
                                                </th>
                                            </tr>
                                        </thead>
                                        <tbody className="bg-white divide-y divide-gray-200">
                                            {selectedProducts.map((product, index) => (
                                                <tr key={index}>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                                                        {product.partName || product.manufacturerPart || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        {product.category || "N/A"}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <div className="flex items-center space-x-2">
                                                            <button
                                                                onClick={() => updateProductQuantity(index, Math.max(1, product.orderQty - 1))}
                                                                className="text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
                                                            >
                                                                -
                                                            </button>
                                                            <span>{product.orderQty}</span>
                                                            <button
                                                                onClick={() => updateProductQuantity(index, product.orderQty + 1)}
                                                                className="text-gray-600 hover:text-blue-700 bg-gray-100 hover:bg-gray-200 rounded-full w-6 h-6 flex items-center justify-center"
                                                            >
                                                                +
                                                            </button>
                                                        </div>
                                                    </td>
                                                    {showActualPrice && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${parseFloat(product.costPrice || 0).toFixed(2)}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${parseFloat(product.salePrice || 0).toFixed(2)}
                                                    </td>
                                                    {showActualPrice && (
                                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                            ${(parseFloat(product.costPrice || 0) * product.orderQty).toFixed(2)}
                                                        </td>
                                                    )}
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        ${(parseFloat(product.salePrice || 0) * product.orderQty).toFixed(2)}
                                                    </td>
                                                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                                        <button
                                                            onClick={() => removeProductFromOrder(index)}
                                                            className="text-red-600 hover:text-red-800"
                                                        >
                                                            <Trash2 className="w-5 h-5" />
                                                        </button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </table>
                                </div>

                                {/* Totals Section */}
                                <div className="mt-6 border-t border-gray-200 pt-4">
                                    <div className="flex flex-col items-end space-y-2">
                                        {showActualPrice && (
                                            <div className="text-gray-700">
                                                <span className="font-medium">Total Price:</span>{" "}
                                                <span className="text-lg">${priceTotal.toFixed(2)}</span>
                                            </div>
                                        )}
                                        <div className="text-gray-700">
                                            <span className="font-medium">Total Sale Price:</span>{" "}
                                            <span className="text-lg">${salePriceTotal.toFixed(2)}</span>
                                        </div>
                                    </div>
                                </div>

                                {/* Action Buttons */}
                                <div className="mt-6 flex justify-end space-x-4">
                                    <button
                                        type="button"
                                        onClick={clearForm}
                                        className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 flex items-center"
                                    >
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Clear
                                    </button>
                                    <button
                                        type="button"
                                        onClick={saveOrderToGitHub}
                                        disabled={isLoading}
                                        className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 flex items-center"
                                    >
                                        {isLoading ? (
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                        ) : (
                                            <Save className="w-4 h-4 mr-2" />
                                        )}
                                        Save Order
                                    </button>
                                </div>
                            </>
                        ) : (
                            <div className="text-center py-12">
                                <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                                <p className="text-gray-500">No products added to order yet</p>
                            </div>
                        )}
                    </div>
                </div>
            </main>
        </div>
    );
};

export default OrderCheckout;