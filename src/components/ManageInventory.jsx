"use client";
import { useState, useEffect } from "react";
import { Search, Edit, Trash, Download, AlertCircle, Package, Filter, RefreshCw, ChevronDown, Upload,Store, ClipboardList, Clipboard, Home } from "lucide-react";
import Link from "next/link";

const ManageInventory = () => {
  // State for inventory items
  const [inventoryItems, setInventoryItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // State for search and filters
  const [searchTerm, setSearchTerm] = useState("");
  const [viewMode, setViewMode] = useState("all");
  const [showFilters, setShowFilters] = useState(false);
  const [selectedItems, setSelectedItems] = useState([]);
  const [selectAll, setSelectAll] = useState(false);
  
  // State for sorting
  const [sortField, setSortField] = useState("part");
  const [sortDirection, setSortDirection] = useState("asc");
  
  // State for filters
  const [filters, setFilters] = useState({
    category: "",
    manufacturer: "",
    minStock: "",
    maxStock: ""
  });
  
  // State for GitHub configuration (same as in AddInventoryForm)
  const [githubConfig, setGithubConfig] = useState({
    token: process.env.REACT_APP_DATABASE_PAT,
    repo: "inventory-app",
    owner: "VISHNUMK50",
    branch: "master",
    path: "database"
  });

  // Fetch inventory items on component mount
  useEffect(() => {
    fetchInventoryItems();
  }, []);

  // Apply filters and search when inventory items, search term, or filters change
  useEffect(() => {
    if (inventoryItems.length > 0) {
      applyFiltersAndSearch();
    }
  }, [inventoryItems, searchTerm, filters, viewMode]);

  useEffect(() => {
  console.log("Inventory items after fetch:", inventoryItems);
  console.log("View mode:", viewMode);
  if (inventoryItems.length > 0) {
    applyFiltersAndSearch();
  }
}, [inventoryItems, searchTerm, filters, viewMode]);


  // Fetch inventory items from GitHub or localStorage
  const fetchInventoryItems = async () => {
    setIsLoading(true);
    setError(null);
    
    try {
      const { token, repo, owner, path } = githubConfig;
      
      // If GitHub config is not complete, try localStorage
      if (!token || !repo || !owner) {
        const localItems = localStorage.getItem('inventoryItems');
        if (localItems) {
          const items = JSON.parse(localItems);
          setInventoryItems(items);
          setFilteredItems(items);
        } else {
          // If no items in localStorage, use sample data
          setInventoryItems(sampleInventoryItems);
          setFilteredItems(sampleInventoryItems);
        }
        setIsLoading(false);
        return;
      }
      
      // Path to the jsons directory
      const jsonDirPath = `${path}/jsons`;
      
      // GitHub API URL for contents
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
      
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });
      
      if (response.status === 404) {
        // Directory doesn't exist
        throw new Error("Inventory directory not found");
      }
      
      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }
      
      const files = await response.json();
      
      // Fetch content of each JSON file
      const itemPromises = files.map(async (file) => {
        if (file.type === "file" && file.name.endsWith(".json")) {
          const fileResponse = await fetch(file.download_url);
          if (fileResponse.ok) {
            return await fileResponse.json();
          }
        }
        return null;
      });
      
      const items = (await Promise.all(itemPromises)).filter(item => item !== null);
      
      // Set state with fetched items
      setInventoryItems(items.length > 0 ? items : sampleInventoryItems);
      setFilteredItems(items.length > 0 ? items : sampleInventoryItems);
      
    } catch (error) {
      console.error("Error fetching inventory items:", error);
      setError(error.message);
      // Fall back to sample data
      setInventoryItems(sampleInventoryItems);
      setFilteredItems(sampleInventoryItems);
    } finally {
      setIsLoading(false);
    }
  };

  // Apply filters and search to inventory items
  const applyFiltersAndSearch = () => {
    let result = [...inventoryItems];
    
    // Apply active/inactive filter
    if (viewMode === "active") {
      result = result.filter(item => Number(item.quantity) > 0);
    } else if (viewMode === "inactive") {
      result = result.filter(item => Number(item.quantity) <= 0);
    }
    
    // Apply search term
    if (searchTerm) {
      const search = searchTerm.toLowerCase();
      result = result.filter(item => 
        (item.partName && item.partName.toLowerCase().includes(search)) ||
        (item.manufacturerPart && item.manufacturerPart.toLowerCase().includes(search)) ||
        (item.description && item.description.toLowerCase().includes(search))
      );
    }
    
    // Apply category filter
    if (filters.category) {
      result = result.filter(item => item.category === filters.category);
    }
    
    // Apply manufacturer filter
    if (filters.manufacturer) {
      result = result.filter(item => item.manufacturer === filters.manufacturer);
    }
    
    // Apply min stock filter
    if (filters.minStock !== "") {
      result = result.filter(item => Number(item.quantity) >= Number(filters.minStock));
    }
    
    // Apply max stock filter
    if (filters.maxStock !== "") {
      result = result.filter(item => Number(item.quantity) <= Number(filters.maxStock));
    }
    
    // Apply sorting
    result.sort((a, b) => {
      let valA, valB;
      
      // Determine values to compare based on sortField
      switch (sortField) {
        case "part":
          valA = a.manufacturerPart || "";
          valB = b.manufacturerPart || "";
          break;
        case "manufacturer":
          valA = a.manufacturer || "";
          valB = b.manufacturer || "";
          break;
        case "description":
          valA = a.description || "";
          valB = b.description || "";
          break;
        case "bin":
          valA = a.bin || "";
          valB = b.bin || "";
          break;
        case "stock":
          valA = Number(a.quantity) || 0;
          valB = Number(b.quantity) || 0;
          break;
        case "onLoan":
          // Assuming onLoan is a property that might be added later
          valA = Number(a.onLoan) || 0;
          valB = Number(b.onLoan) || 0;
          break;
        default:
          valA = a.manufacturerPart || "";
          valB = b.manufacturerPart || "";
      }
      
      // Compare values based on sort direction
      if (sortDirection === "asc") {
        return valA > valB ? 1 : valA < valB ? -1 : 0;
      } else {
        return valA < valB ? 1 : valA > valB ? -1 : 0;
      }
    });
    console.log("Filtered items:", result); // Move this line here

    setFilteredItems(result);
  };

  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction if clicking on the same field
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Handle checkbox change for item selection
  const handleSelectItem = (itemId) => {
    if (selectedItems.includes(itemId)) {
      setSelectedItems(selectedItems.filter(id => id !== itemId));
    } else {
      setSelectedItems([...selectedItems, itemId]);
    }
  };

  // Handle select all checkbox
  const handleSelectAll = () => {
    if (selectAll) {
      setSelectedItems([]);
    } else {
      setSelectedItems(filteredItems.map(item => item.manufacturerPart));
    }
    setSelectAll(!selectAll);
  };

  // Handle search input change
  const handleSearchChange = (e) => {
    setSearchTerm(e.target.value);
  };

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters({
      ...filters,
      [name]: value
    });
  };

  // Reset all filters
  const resetFilters = () => {
    setFilters({
      category: "",
      manufacturer: "",
      minStock: "",
      maxStock: ""
    });
    setSearchTerm("");
  };

  // Get unique categories for filter dropdown
  const getUniqueCategories = () => {
    const categories = inventoryItems.map(item => item.category).filter(Boolean);
    return [...new Set(categories)];
  };

  // Get unique manufacturers for filter dropdown
  const getUniqueManufacturers = () => {
    const manufacturers = inventoryItems.map(item => item.manufacturer).filter(Boolean);
    return [...new Set(manufacturers)];
  };

  // Export selected items to CSV
  const exportToCSV = () => {
    // Get selected items or all filtered items if none selected
    const itemsToExport = selectedItems.length > 0 
      ? filteredItems.filter(item => selectedItems.includes(item.manufacturerPart))
      : filteredItems;
    
    if (itemsToExport.length === 0) {
      alert("No items to export");
      return;
    }
    
    // Create CSV header
    const headers = ["Part #", "Manufacturer", "Description", "Bin", "In-Stock", "On Loan"];
    
    // Create CSV rows
    const rows = itemsToExport.map(item => [
      item.manufacturerPart || "",
      item.manufacturer || "",
      item.description || "",
      item.bin || "",
      item.quantity || "0",
      "0" // Placeholder for on loan
    ]);
    
    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.join(","))
    ].join("\n");
    
    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Copy selected items to clipboard
  const copyToClipboard = () => {
    // Get selected items or all filtered items if none selected
    const itemsToCopy = selectedItems.length > 0 
      ? filteredItems.filter(item => selectedItems.includes(item.manufacturerPart))
      : filteredItems;
    
    if (itemsToCopy.length === 0) {
      alert("No items to copy");
      return;
    }
    
    // Create text representation
    const headers = ["Part #", "Manufacturer", "Description", "Bin", "In-Stock"];
    
    // Create text rows
    const rows = itemsToCopy.map(item => [
      item.manufacturerPart || "",
      item.manufacturer || "",
      item.description || "",
      item.bin || "",
      item.quantity || "0"
    ]);
    
    // Combine headers and rows with tab separation for better paste experience
    const textContent = [
      headers.join("\t"),
      ...rows.map(row => row.join("\t"))
    ].join("\n");
    
    // Copy to clipboard
    navigator.clipboard.writeText(textContent)
      .then(() => alert("Inventory data copied to clipboard"))
      .catch(err => alert("Failed to copy: " + err));
  };

  // Delete selected items (stub for now)
  const deleteSelectedItems = () => {
    if (selectedItems.length === 0) {
      alert("No items selected for deletion");
      return;
    }
    
    if (confirm(`Are you sure you want to delete ${selectedItems.length} item(s)?`)) {
      // Filter out selected items
      const newItems = inventoryItems.filter(
        item => !selectedItems.includes(item.manufacturerPart)
      );
      
      setInventoryItems(newItems);
      setSelectedItems([]);
      setSelectAll(false);
      
      alert(`Deleted ${selectedItems.length} item(s) successfully`);
      
      // In a real implementation, you would also handle deletion from GitHub or localStorage
    }
  };

  // Sample inventory data for testing
  const sampleInventoryItems = [
    {
      manufacturerPart: "JST-XH 2.54mm Female-Female 2 Pin 25cm Wire",
      manufacturer: "HUBTRONICS",
      description: "XH2515 JST-XH 2.54mm Female-Female 2 Pin Reverse Proof Connector 25cm Wire",
      bin: "5",
      quantity: "5",
      category: "Connector",
      onLoan: "0"
    },
    {
      manufacturerPart: "0603 Red Led",
      manufacturer: "HUBTRONICS",
      description: "19-21SURC/S530-A3/TR8 0603 Red SMD Led (Pack of 10)",
      bin: "20",
      quantity: "20",
      category: "LED",
      onLoan: "0"
    },
    {
      manufacturerPart: "0603 Blue Led",
      manufacturer: "HUBTRONICS",
      description: "19-21/BHC-AN1P2/2T 0603 Blue SMD Led (Pack of 10)",
      bin: "20",
      quantity: "20",
      category: "LED",
      onLoan: "0"
    },
    {
      manufacturerPart: "TTP229-BSF 6-18 Keys Capacitive Touch Pad",
      manufacturer: "HUBTRONICS",
      description: "TTP229-BSF 6-18 Keys Capacitive Touch Pad Detector IC SSOP-28",
      bin: "5",
      quantity: "5",
      category: "IC",
      onLoan: "0"
    },
    {
      manufacturerPart: "Syringe Needle 18G 0.84mm Inner Dia",
      manufacturer: "HUBTRONICS",
      description: "Syringe Needle for Soldering Paste / Flux Dispenser - 18G 0.84mm Inner Dia",
      bin: "1",
      quantity: "1",
      category: "Tool",
      onLoan: "0"
    },
    {
      manufacturerPart: "ULN2803A Darlington Transistor Arrays",
      manufacturer: "HUBTRONICS",
      description: "ULN2803A Darlington Transistor Arrays QFN-20-EP(4x4)",
      bin: "5",
      quantity: "5",
      category: "Transistor",
      onLoan: "0"
    }
  ];

  // Render sort indicator for table headers
  const renderSortIndicator = (field) => {
    if (sortField === field) {
      return sortDirection === "asc" ? " ▲" : " ▼";
    }
    return "";
  };
  const [scrolled, setScrolled] = useState(false);
  
  // Add scroll event listener to track when to apply fixed positioning
  useEffect(() => {
    const handleScroll = () => {
      // Get the header height to know when to trigger fixed position
      const mainHeaderHeight = document.querySelector('.main-header')?.offsetHeight || 0;
      if (window.scrollY > mainHeaderHeight) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };
    
    // Add scroll event listener
    window.addEventListener('scroll', handleScroll);
    
    // Clean up
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      {/* Main header - with class for targeting */}
      <header className="main-header bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="mx-auto py-4 px-6">
          <div className="flex items justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8" />
              <span className="text-2xl font-bold">InventoryPro</span>
            </div>
            <h2 className="ml-60 text-3xl font-bold">
              Inventory Management System
            </h2>
            <div className="flex items-center">
              <Link href="/" className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center">
                <Home className="h-4 w-4 mr-2" /> Back to Dashboard
              </Link>
              <span className="mr-4">Welcome, Admin</span>
              <button className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Fixed position action bar with a placeholder for when it's fixed */}
      {scrolled && (
        <div 
          style={{ 
            position: 'fixed', 
            top: 0, 
            left: 0, 
            right: 0, 
            zIndex: 50 
          }}
          className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-md"
        >
          <div className="flex items-center justify-between py-3 px-6 border-t border-purple-500">
            <h2 className="text-2xl font-bold text-white flex items-center">
              <Store className="mr-2 h-5 w-5" /> Manage Products
            </h2>
          </div>
        </div>
      )}

      {/* Regular action bar - always visible in the flow */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-700 shadow-md">
        <div className="flex items-center justify-between py-3 px-6 border-t border-purple-500">
          <h2 className="text-2xl font-bold text-white flex items-center">
            <Store className="mr-2 h-5 w-5" /> Manage Products
          </h2>
        </div>
      </div>

      {/* Add space to prevent content jump when the bar becomes fixed */}
      {scrolled && <div style={{ height: '64px' }}></div>}

      {/* Action Buttons and Search */}
      <div className="p-4 flex flex-wrap justify-between items-center gap-3 border-b border-gray-200">
        <div className="flex flex-wrap gap-2">
          <button 
            className="px-4 py-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
            onClick={() => setShowFilters(!showFilters)}
          >
            <Filter className="w-4 h-4 mr-2" /> Filter
          </button>
          
          <button 
            className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
            onClick={fetchInventoryItems}
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
          
          <div className="relative">
            <button 
              className="px-4 py-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
            >
              View <ChevronDown className="w-4 h-4 ml-1" />
            </button>
            <select
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              value={viewMode}
              onChange={(e) => setViewMode(e.target.value)}
            >
              <option value="all">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          
          {selectedItems.length > 0 && (
            <div className="flex gap-2">
              <button 
                className="px-4 py-2 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center"
                onClick={deleteSelectedItems}
              >
                <Trash className="w-4 h-4 mr-2" /> Delete
              </button>
              
              <button 
                className="px-4 py-2 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center"
                onClick={exportToCSV}
              >
                <Download className="w-4 h-4 mr-2" /> Export
              </button>
              
              <button 
                className="px-4 py-2 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center"
                onClick={copyToClipboard}
              >
                <Clipboard className="w-4 h-4 mr-2" /> Copy
              </button>
            </div>
          )}
        </div>
        
        <div className="flex gap-2 items-center">
          <div className="relative">
            <input
              type="text"
              placeholder="Search inventory..."
              value={searchTerm}
              onChange={handleSearchChange}
              className="pl-9 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 w-64"
            />
            <Search className="w-4 h-4 text-gray-400 absolute left-3 top-3" />
          </div>
          
          <Link href="/add-product">
            <button className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
              + Add Product
            </button>
          </Link>
        </div>
      </div>
      
      {/* Filters Section */}
      {showFilters && (
        <div className="p-4 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap gap-4">
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Manufacturer</label>
              <select
                name="manufacturer"
                value={filters.manufacturer}
                onChange={handleFilterChange}
                className="w-full md:w-48 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">All Manufacturers</option>
                {getUniqueManufacturers().map(mfr => (
                  <option key={mfr} value={mfr}>{mfr}</option>
                ))}
              </select>
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Min Stock</label>
              <input
                type="number"
                name="minStock"
                value={filters.minStock}
                onChange={handleFilterChange}
                className="w-full md:w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div className="w-full md:w-auto">
              <label className="block text-sm font-medium text-gray-700 mb-1">Max Stock</label>
              <input
                type="number"
                name="maxStock"
                value={filters.maxStock}
                onChange={handleFilterChange}
                className="w-full md:w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                min="0"
              />
            </div>
            
            <div className="w-full md:w-auto flex items-end">
              <button
                onClick={resetFilters}
                className="px-4 py-2 bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
              >
                Reset Filters
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Loading and Error States */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading inventory data...</p>
        </div>
      )}
      
      {error && !isLoading && (
        <div className="p-6 bg-red-50 flex items-center justify-center">
          <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
          <p className="text-red-700">Error loading inventory: {error}</p>
        </div>
      )}
      
      {/* Inventory Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("part")}
                >
                  Part # {renderSortIndicator("part")}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("manufacturer")}
                >
                  Manufacturer {renderSortIndicator("manufacturer")}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("description")}
                >
                  Description {renderSortIndicator("description")}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("bin")}
                >
                  Bin {renderSortIndicator("bin")}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("stock")}
                >
                  In-Stock {renderSortIndicator("stock")}
                </th>
                <th 
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("onLoan")}
                >
                  On Loan {renderSortIndicator("onLoan")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
                    No inventory items found. Try adjusting your filters or adding new items.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.manufacturerPart)}
                        onChange={() => handleSelectItem(item.manufacturerPart)}
                        className="h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-blue-600 hover:underline cursor-pointer">
                      {item.manufacturerPart}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.manufacturer}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.bin}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.quantity}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.onLoan || 0}</td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <button className="text-blue-600 hover:text-blue-800">
                          <Edit className="h-4 w-4" />
                        </button>
                        <button className="text-red-600 hover:text-red-800">
                          <Trash className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )}
      
      {/* Stats Footer */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredItems.length}</span> of <span className="font-medium">{inventoryItems.length}</span> items
          {selectedItems.length > 0 && (
            <span> | <span className="font-medium">{selectedItems.length}</span> selected</span>
          )}
        </div>
        <div className="text-sm text-gray-600"   suppressHydrationWarning // Add this prop
        >
            Last updated: {new Date().toLocaleString('en-US', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
            second: '2-digit',
            hour12: true
            })}
        </div>
      </div>
    </div>
  );
};

export default ManageInventory;
