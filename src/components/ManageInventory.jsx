"use client";
import { useState, useEffect } from "react";
import { Search, Edit, Trash, Download, AlertCircle, X, Eye, FileSpreadsheet, PlusCircle, Filter, RefreshCw, ChevronDown, Upload, Store, ClipboardList, Clipboard, Home } from "lucide-react";
import Link from "next/link";
import githubConfig from '../config/githubConfig';
import Header from "@/components/Header";
import TimeStamp from '@/components/TimeStamp';

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
  const CACHE_DURATION = 30000; // 30 seconds in milliseconds
  const [lastFetchTime, setLastFetchTime] = useState(0);
  // State for filters
  const [filters, setFilters] = useState({
    category: "",
    manufacturer: "",
    vendor: "",
    minStock: "",
    maxStock: ""
  });

  // Initialize state with the imported config
  const [config, setConfig] = useState(githubConfig);

  // You can still update it if needed
  const updateConfig = (newConfig) => {
    setConfig({ ...config, ...newConfig });
  };

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
    if (inventoryItems.length > 0) {
      applyFiltersAndSearch();
    }
  }, [sortField, sortDirection]);

  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      console.log('Inventory updated, refreshing data...');
      fetchInventoryData(true);
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, []);

  useEffect(() => {
    console.log("Inventory items after fetch:", inventoryItems);
    console.log("View mode:", viewMode);
    if (inventoryItems.length > 0) {
      applyFiltersAndSearch();
    }
  }, [inventoryItems, searchTerm, filters, viewMode]);

  // Add this function before fetchInventoryItems
  const testGitHubAccess = async () => {
    try {
      console.log(`Testing access to: https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}`);

      const response = await fetch(`https://api.github.com/repos/${githubConfig.owner}/${githubConfig.repo}`, {
        headers: {
          "Authorization": `Bearer ${githubConfig.token}`
        }
      });

      console.log("Response status:", response.status);
      const data = await response.json();
      console.log("GitHub API response:", data);

      if (!response.ok) {
        setError(`GitHub API error: ${response.status} - ${data.message || 'Unknown error'}`);
      }

      return response.ok;
    } catch (error) {
      console.error("GitHub access test failed:", error);
      return false;
    }
  };
  const fetchInventoryData = async (force = false) => {
    const now = Date.now();
    if (!force && (now - lastFetchTime) < CACHE_DURATION) {
      return; // Use cached data if within duration
    }

    try {
      // ... existing fetch code ...
      setLastFetchTime(now);
    } catch (error) {
      console.error('Fetch error:', error);
    }
  };
  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      console.log('Inventory updated, refreshing data...');
      fetchInventoryData(true);
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, []);
  const processFiles = async (files) => {
    // Fetch content of each JSON file
    const itemPromises = files.map(async (file) => {
      if (file.type === "file" && file.name.endsWith(".json")) {
        try {
          console.log(`Fetching file: ${file.name}`);

          // Use the correct authentication method for raw content
          const fileResponse = await fetch(file.download_url, {
            headers: {
              // Note: GitHub doesn't support token auth for raw.githubusercontent.com
              // Instead, we can use this header if we have a valid token
              "Accept": "application/vnd.github.v3.raw"
            }
          });

          if (!fileResponse.ok) {
            console.error(`Error fetching ${file.name}: ${fileResponse.status}`);
            return null;
          }

          const itemData = await fileResponse.json();

          // Extract ID from filename if it follows the pattern id-PartName-ManufacturerPart.json
          const fileNameMatch = file.name.match(/^(\d+)-.*\.json$/);
          if (fileNameMatch && !itemData.id) {
            itemData.id = fileNameMatch[1];
          }

          return itemData;
        } catch (error) {
          console.error(`Error processing file ${file.name}:`, error);
          return null;
        }
      }
      return null;
    });

    const items = (await Promise.all(itemPromises)).filter(item => item !== null);
    console.log(`Successfully loaded ${items.length} items`);

    setInventoryItems(items);
    setFilteredItems(items);

    // // Save to localStorage as backup
    // localStorage.setItem('inventoryItems', JSON.stringify(items));

    return items;
  };

  // Fetch inventory items from GitHub or localStorage
  const fetchInventoryItems = async () => {
    setIsLoading(true);
    setError(null);

    console.log("GitHub config:", {
      owner: githubConfig.owner,
      repo: githubConfig.repo,
      path: githubConfig.path,
      hasToken: !!githubConfig.token
    });

    if (!githubConfig.token || !githubConfig.repo || !githubConfig.owner) {
      console.error("GitHub configuration is incomplete");
      setError("GitHub configuration is incomplete");
      setIsLoading(false);
      return;
    }

    try {
      const { token, repo, owner, path } = githubConfig;

      // First, test GitHub API access
      const canAccessGitHub = await testGitHubAccess();
      if (!canAccessGitHub) {
        throw new Error("Could not access GitHub API with provided credentials");
      }

      // Ensure correct path structure
      // The error shows /db/jsons/ but your code may use a different path
      // For debugging, let's try both path structures
      const jsonDirPath = path ? `${path}/jsons` : 'db/jsons';
      console.log(`Trying to fetch from directory: ${jsonDirPath}`);

      // GitHub API URL for contents
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
      console.log(`Fetching directory listing from: ${apiUrl}`);

      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      // Log response details for debugging
      console.log(`Directory listing response status: ${response.status}`);

      if (response.status === 404) {
        // Try alternative path as fallback
        const altPath = path ? 'db/jsons' : 'database/jsons';
        console.log(`Directory not found. Trying alternative path: ${altPath}`);

        const altApiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${altPath}`;
        const altResponse = await fetch(altApiUrl, {
          headers: {
            "Authorization": `token ${token}`,
            "Accept": "application/vnd.github.v3+json"
          }
        });

        if (altResponse.status === 404) {
          throw new Error("Inventory directory not found in either location");
        }

        if (!altResponse.ok) {
          const errorData = await altResponse.json().catch(() => ({}));
          throw new Error(`GitHub API error: ${altResponse.status} - ${errorData.message || altResponse.statusText}`);
        }

        const files = await altResponse.json();
        console.log(`Found ${files.length} files in alternative directory`);

        // Update path for future use if this worked
        updateConfig({ path: altPath.split('/')[0] });

        return processFiles(files);
      }

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`GitHub API error: ${response.status} - ${errorData.message || response.statusText}`);
      }

      const files = await response.json();
      const items = await processFiles(files);
      console.log(`Found ${files.length} files in directory`);
      setInventoryItems(items);
      setFilteredItems(items);
      return processFiles(files);

    } catch (error) {
      console.error("Error fetching inventory items:", error);
      setError(error.message);

      // Try to load from localStorage as fallback
      // const localItems = localStorage.getItem('inventoryItems');
      // if (localItems) {
      //   console.log("Loading items from localStorage as fallback");
      //   const items = JSON.parse(localItems);
      //   setInventoryItems(items);
      //   setFilteredItems(items);
      // }
    } finally {
      setIsLoading(false);
    }
  };

  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const openPdfModal = (item) => {
    if (!item.datasheet) {
      alert("No datasheet available for this item");
      return;
    }
    setPdfUrl(item.datasheet);
    setIsPdfModalOpen(true);
  };

  // Close PDF modal
  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfUrl("");
  };

  const PdfViewerModal = ({ isOpen, pdfUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);

    // Create a Google Docs viewer URL
    const getViewerUrl = (url) => {
      return `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
    };

    if (!isOpen) return null;

    return (
      <div
        className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4"
        onClick={(e) => e.target === e.currentTarget && onClose()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <div className="fixed bg-gray-500 rounded-lg shadow-2xl w-[75%] h-[95vh] flex flex-col m-auto">
          <div className="px-3 p-1 flex items-center justify-between">
            <h3 id="modal-title" className="text-l text-white font-medium">Datasheet Preview</h3>
            <div className="flex space-x-2">
              <a
                href={pdfUrl}
                download
                className="p-1  bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center text-xs"
              >
                <Download className="w-3 h-3 mr-1" /> Download PDF
              </a>
              <button
                onClick={onClose}
                className="p-1 hover:bg-gray-400 rounded-full"
                aria-label="Close modal"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="flex-grow overflow-hidden relative min-h-[600px]">
            {isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700"></div>
              </div>
            )}

            {error && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-50">
                <div className="text-red-600 flex items-center">
                  <AlertCircle className="w-5 h-5 mr-2" />
                  {error}
                </div>
              </div>
            )}

            <iframe
              src={getViewerUrl(pdfUrl)}
              className="w-full h-full rounded-lg "
              title="PDF Viewer"
              onLoad={() => setIsLoading(false)}
              onError={() => {
                setIsLoading(false);
                setError('Failed to load PDF');
              }}
            />
          </div>
        </div>
      </div>
    );
  };
  // Add these state variables to your component
  const [modalOpen, setModalOpen] = useState(false);
  const [selectedImage, setSelectedImage] = useState({ url: '', alt: '' });

  // Add this function to handle image click
  const handleImageClick = (url, alt) => {
    setSelectedImage({ url, alt });
    setModalOpen(true);
  };
  const getUniqueVendors = () => {
    const vendors = inventoryItems
      .map(item => item.vendor)
      .filter(Boolean)
      .sort();
    return [...new Set(vendors)];
  };
  // Apply filters and search to inventory items
  const applyFiltersAndSearch = () => {
    let result = [...inventoryItems];

    // Apply active/inactive filter
    if (viewMode === "active") {
      result = result.filter(item => Number(item.avl_quantity) > 0);
    } else if (viewMode === "inactive") {
      result = result.filter(item => Number(item.avl_quantity) <= 0);
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
    if (filters.vendor) {
      result = result.filter(item => item.vendor === filters.vendor);
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
        case "id":
          valA = parseInt(a.id) || 0;
          valB = parseInt(b.id) || 0;
          break;
        case "partname":
          valA = (a.partName || "").toLowerCase();
          valB = (b.partName || "").toLowerCase();
          break;
        case "manufacturerpart":
          valA = (a.manufacturerPart || "").toLowerCase();
          valB = (b.manufacturerPart || "").toLowerCase();
          break;
        case "vendor":
          valA = (a.vendor || "").toLowerCase();
          valB = (b.vendor || "").toLowerCase();
          break;
        case "category":
          valA = (a.category || "").toLowerCase();
          valB = (b.category || "").toLowerCase();
          break;
        case "description":
          valA = (a.description || "").toLowerCase();
          valB = (b.description || "").toLowerCase();
          break;
        case "stock":
          valA = parseFloat(a.avl_quantity) || 0;
          valB = parseFloat(b.avl_quantity) || 0;
          break;
        case "bin":
          valA = a.binLocations?.[0]?.bin || "";
          valB = b.binLocations?.[0]?.bin || "";
          break;
        default:
          valA = (a.manufacturerPart || "").toLowerCase();
          valB = (b.manufacturerPart || "").toLowerCase();
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

  // Add these helper functions after the existing GitHub config import

  // Function to move file to recycle bin
  const moveToRecycleBin = async (itemId) => {
    const { token, repo, owner, path } = githubConfig;

    try {
      // First create the recycle-bin folder if it doesn't exist
      const recycleBinPath = `${path}/recycle-bin`;

      // Find the complete item to get filename
      const item = inventoryItems.find(item => item.manufacturerPart === itemId);
      if (!item) {
        throw new Error("Item not found in inventory data");
      }

      const fileName = `${item.id}-${item.partName}-${item.manufacturerPart}.json`.replace(/\s+/g, '_');
      const sourceFilePath = `${path}/jsons/${fileName}`;
      const targetFilePath = `${recycleBinPath}/${fileName}`;

      // Get the source file's content and SHA
      const fileResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${sourceFilePath}`, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      if (!fileResponse.ok) {
        throw new Error(`Failed to get source file: ${fileResponse.status}`);
      }

      const fileData = await fileResponse.json();

      // Create the content in base64
      const contentStr = JSON.stringify(item, null, 2);
      const contentBase64 = btoa(unescape(encodeURIComponent(contentStr)));

      // Create file in recycle bin
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${targetFilePath}`, {
        method: 'PUT',
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Moved ${fileName} to recycle bin`,
          content: contentBase64,
          branch: 'master'
        })
      });

      // Delete original file
      await fetch(`https://api.github.com/repos/${owner}/${repo}/contents/${sourceFilePath}`, {
        method: 'DELETE',
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: `Moved to recycle bin: ${fileName}`,
          sha: fileData.sha
        })
      });

      return true;
    } catch (error) {
      console.error("Error moving file to recycle bin:", error);
      throw error;
    }
  };

  // Replace the existing handleDeleteItem function with this updated version:
  const handleDeleteItem = async (itemId) => {
    if (confirm(`Are you sure you want to move this item to the recycle bin?`)) {
      try {
        setIsLoading(true);

        if (!githubConfig.token || !githubConfig.repo || !githubConfig.owner) {
          throw new Error("Incomplete GitHub configuration");
        }

        // Move file to recycle bin
        await moveToRecycleBin(itemId);

        // Update UI after successful move
        const newItems = inventoryItems.filter(
          item => item.manufacturerPart !== itemId
        );

        setInventoryItems(newItems);
        setFilteredItems(prevFiltered => prevFiltered.filter(
          item => item.manufacturerPart !== itemId
        ));

        // Remove from selected items if present
        if (selectedItems.includes(itemId)) {
          setSelectedItems(prevSelected => prevSelected.filter(id => id !== itemId));
        }

        alert(`Item moved to recycle bin successfully`);
      } catch (error) {
        console.error("Move to recycle bin operation failed:", error);
        alert(`Error moving item to recycle bin: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };

  // Also update the deleteSelectedItems function:
  const deleteSelectedItems = async () => {
    if (selectedItems.length === 0) {
      alert("No items selected to move");
      return;
    }

    if (confirm(`Are you sure you want to move ${selectedItems.length} item(s) to the recycle bin?`)) {
      try {
        setIsLoading(true);
        const results = { success: [], failed: [] };

        // Move items one by one
        for (const itemId of selectedItems) {
          try {
            await moveToRecycleBin(itemId);
            results.success.push(itemId);
          } catch (error) {
            console.error(`Failed to move ${itemId}:`, error);
            results.failed.push(itemId);
          }
        }

        // Update UI for successful moves
        if (results.success.length > 0) {
          const newItems = inventoryItems.filter(
            item => !results.success.includes(item.manufacturerPart)
          );

          setInventoryItems(newItems);
          setFilteredItems(prevFiltered => prevFiltered.filter(
            item => !results.success.includes(item.manufacturerPart)
          ));

          setSelectedItems([]);
          setSelectAll(false);
        }

        // Show appropriate message
        if (results.failed.length === 0) {
          alert(`Successfully moved ${results.success.length} item(s) to recycle bin`);
        } else {
          alert(`Moved ${results.success.length} item(s) to recycle bin. Failed to move ${results.failed.length} item(s).`);
        }
      } catch (error) {
        console.error("Move to recycle bin operation failed:", error);
        alert(`Error moving items to recycle bin: ${error.message}`);
      } finally {
        setIsLoading(false);
      }
    }
  };
  // Improved GitHub file deletion function with better error handling
  const deleteFileFromGitHub = async (itemId) => {
    if (!itemId) {
      throw new Error("Invalid item ID for deletion");
    }

    try {
      const { token, repo, owner, path } = githubConfig;

      // Validate GitHub config
      if (!token || !repo || !owner) {
        throw new Error("Incomplete GitHub configuration");
      }

      // Find the complete item to get all necessary fields for filename
      const item = inventoryItems.find(item => item.manufacturerPart === itemId);
      if (!item) {
        throw new Error("Item not found in inventory data");
      }
      // Use the correct file naming format
      const fileName = `${item.id}-${item.partName}-${item.manufacturerPart}.json`.replace(/\s+/g, '_');

      // Path to the specific JSON file
      const filePath = `${path}/jsons/${fileName}`;
      console.log(`Attempting to delete: ${filePath}`);

      // First, we need to get the file's SHA
      const fileInfoUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;

      const infoResponse = await fetch(fileInfoUrl, {
        headers: {
          "Authorization": `token ${token}`,
          "Accept": "application/vnd.github.v3+json"
        }
      });

      // Handle file not found case
      if (infoResponse.status === 404) {
        console.warn(`File ${filePath} not found on GitHub`);
        return true; // Consider it a success if the file doesn't exist
      }

      // Handle other API errors
      if (!infoResponse.ok) {
        const errorData = await infoResponse.json().catch(() => ({}));
        throw new Error(`GitHub API error ${infoResponse.status}: ${errorData.message || infoResponse.statusText}`);
      }

      const fileInfo = await infoResponse.json();
      if (!fileInfo || !fileInfo.sha) {
        throw new Error("Failed to get file SHA from GitHub");
      }

      // Now delete the file using the SHA
      const deleteResponse = await fetch(fileInfoUrl, {
        method: 'DELETE',
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json",
          "Accept": "application/vnd.github.v3+json"
        },
        body: JSON.stringify({
          message: `Delete inventory item: ${itemId}`,
          sha: fileInfo.sha
        })
      });

      if (!deleteResponse.ok) {
        const errorData = await deleteResponse.json().catch(() => ({}));
        throw new Error(`Delete failed with status ${deleteResponse.status}: ${errorData.message || deleteResponse.statusText}`);
      }

      console.log(`Successfully deleted ${filePath} from GitHub`);
      return true;
    } catch (error) {
      console.error("Error in deleteFileFromGitHub:", error);
      throw error; // Re-throw to allow handling in the caller
    }
  };
  // Handle sort click
  const handleSort = (field) => {
    if (sortField === field) {
      // Toggle sort direction if clicking on the same field
      setSortDirection(prev => prev === "asc" ? "desc" : "asc");
    } else {
      // Set new sort field and default to ascending
      setSortField(field);
      setSortDirection("asc");
    }
    // Apply the sorting immediately
    applyFiltersAndSearch();
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
      vendor: "",
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
    const itemsToExport = selectedItems.length > 0
      ? filteredItems.filter(item => selectedItems.includes(item.manufacturerPart))
      : filteredItems;

    if (itemsToExport.length === 0) {
      alert("No items to export");
      return;
    }

    // Updated headers with all requested fields
    const headers = [
      "id",
      "Created At",
      "Part Name",
      "Manufacturer",
      "Manufacturer Part #",
      "Category",
      "Vendor",
      "Vendor Product Link",
      "Available Quantity",
      "Bin Locations",
      "Cost Price",
      "Sale Price"
    ];

    // Updated row mapping with all requested fields
    const rows = itemsToExport.map(item => [
      item.id || "",
      item.createdAt || "",
      item.partName || "",
      item.manufacturer || "",
      item.manufacturerPart || "",
      item.category || "",
      item.vendor || "",
      item.vendorProductLink || "",
      item.avl_quantity || "0",
      item.binLocations?.map(loc => `${loc.bin}(${loc.quantity})`).join('; ') || "",
      item.costPrice || "0",
      item.salePrice || "0"
    ]);

    // Combine headers and rows
    const csvContent = [
      headers.join(","),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(","))
    ].join("\n");

    // Create and download the CSV file
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `inventory_export_${new Date().toISOString().slice(0, 10)}.csv`);
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
      item.partName || "",
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

  const getPlaceholderFromGitHub = () => {
    const { owner, repo } = githubConfig;
    // Try this path first
    const placeholderUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/database/placeholder.svg`;
    // Fallback to a hardcoded path if the above doesn't work
    const fallbackUrl = "https://raw.githubusercontent.com/VISHNUMK50/inventory-app/master/database/placeholder.svg";

    return placeholderUrl || fallbackUrl;
  };

  // Improved image URL resolution with better fallbacks
  const getImageUrl = (item) => {
    // Check if the item has an image property with a valid URL
    if (item && item.image && typeof item.image === 'string' &&
      (item.image.startsWith('http') || item.image.startsWith('/'))) {
      return item.image;
    }

    // Use a data URL for a simple placeholder if GitHub isn't accessible
    const simplePlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

    return getPlaceholderFromGitHub() || simplePlaceholder;
  };

  // Improved ImagePreview component with better error handling
  const ImagePreview = ({ url, alt, handleClick }) => {
    const [imageError, setImageError] = useState(false);
    const placeholderUrl = getPlaceholderFromGitHub();

    // Use a simple SVG data URL as ultimate fallback
    const ultimateFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

    // Get the source URL, with fallbacks
    const imgSrc = imageError || !url ? placeholderUrl || ultimateFallback : url;

    return (
      <div
        className="h-12 w-12 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
        onClick={handleClick}
        title="Click to view larger image"
      >
        <img
          src={imgSrc}
          alt={alt || "Product Image"}
          className="object-contain h-10 w-10"
          onError={(e) => {
            console.log(`Image error for: ${imgSrc}`);
            setImageError(true);
            e.target.src = ultimateFallback;
          }}
        />
      </div>
    );
  };

  // Improved ImageModal component with better error handling
  const ImageModal = ({ isOpen, imageUrl, altText, onClose }) => {
    const [imgError, setImgError] = useState(false);
    const placeholderUrl = getPlaceholderFromGitHub();

    // Simple SVG data URL as ultimate fallback
    const ultimateFallback = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";

    if (!isOpen) return null;

    // Determine the source with fallbacks
    const imgSrc = imgError || !imageUrl ? placeholderUrl || ultimateFallback : imageUrl;

    return (
      <div className="fixed inset-0  flex items-center justify-center z-50" onClick={onClose}>
        <div className="bg-white p-2 shadow-2xl rounded-lg max-w-2xl max-h-[90vh] overflow-hidden" onClick={e => e.stopPropagation()}>
          <div className="flex justify-end mb-2">
            <button
              className="text-gray-500 hover:text-gray-800"
              onClick={onClose}
            >
              ✕
            </button>
          </div>
          <div className="flex items-center justify-center">
            <img
              src={imgSrc}
              alt={altText || "Product Image"}
              className="max-h-[70vh] max-w-full object-contain bg-gradient-to-b from-gray-300 to-gray-600"
              onError={(e) => {
                console.log(`Modal image error for: ${imgSrc}`);
                setImgError(true);
                e.target.src = ultimateFallback;
              }}
            />
          </div>
          <div className="mt-2 text-center text-sm text-gray-600 truncate">
            {altText || "Product Image"}
          </div>
        </div>
      </div>
    );
  };

  // Helper function to open PDF in viewer
  const openPdfViewer = (pdfUrl, itemId) => {
    // Use Mozilla's PDF.js viewer (most reliable)
    window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(pdfUrl)}`, '_blank');
  };

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      {/* Main header - with class for targeting */}

      <Header title="Inventory Management System" />


      {/* Fixed position action bar with a placeholder for when it's fixed */}
      <div className={`${scrolled ? 'fixed top-0 left-0 right-0 z-50  shadow-md' : 'relative'} bg-gray-300 shadow-md py-1 px-3 sm:px-6 `}>

        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <h2 className="text-2xl font-bold text-black flex items-center">
            <Store className="mr-2 h-5 w-5" /> Manage Products
          </h2>

          <div className="flex flex-wrap items-center gap-2">
            <div className="p-1 flex gap-2">
              <button
                className="p-2 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 flex items-center"
                onClick={() => setShowFilters(!showFilters)}
                title="Filter"
              >
                <Filter className="w-4 h-4" />
              </button>

              <button
                className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center"
                onClick={fetchInventoryItems}
                title="Refresh"
              >
                <RefreshCw className="w-4 h-4" />
              </button>

              <div className="relative">
                <button
                  className="p-2 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 flex items-center"
                  title="View Options"
                >
                  <ChevronDown className="w-4 h-4" />
                </button>
                <select
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  value={viewMode}
                  onChange={(e) => setViewMode(e.target.value)}
                >
                  <option value="all">All Items</option>
                  <option value="active">In Stock</option>
                  <option value="inactive">Out of Stock</option>
                </select>
              </div>
              <div className="hidden sm:flex flex-row gap-2">

                {selectedItems.length > 0 && (
                  <>
                    <button
                      className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center text-sm"
                      onClick={deleteSelectedItems}
                    >
                      <Trash className="w-3 h-3 mr-1" /> Delete
                    </button>

                    <button
                      className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center text-sm"
                      onClick={exportToCSV}
                    >
                      <Download className="w-3 h-3 mr-1" /> Export
                    </button>

                    <button
                      className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center text-sm"
                      onClick={copyToClipboard}
                    >
                      <Clipboard className="w-3 h-3 mr-1" /> Copy
                    </button>
                  </>
                )}            </div>

            </div>

            <div className="relative ">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-48 text-sm bg-white"
              />
              <Search className="w-4 h-4 text-gray-400 absolute left-2 top-2.5" />
            </div>

            <Link href="/add-product">
              <button className="px-2 py-2 sm:py-1 bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center">
                <PlusCircle className="w-4 h-4 " />
                <span className="hidden sm:block ml-2 ">Add Product</span>
              </button>
            </Link>
          </div>
          {selectedItems.length > 0 && (
            <>
              {/* For small screens */}
              <div className="flex flex-row gap-2 sm:hidden">
                <button
                  className="px-3 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 flex items-center text-sm"
                  onClick={deleteSelectedItems}
                >
                  <Trash className="w-3 h-3 mr-1" /> Delete
                </button>

                <button
                  className="px-3 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 flex items-center text-sm"
                  onClick={exportToCSV}
                >
                  <Download className="w-3 h-3 mr-1" /> Export
                </button>

                <button
                  className="px-3 py-1 bg-purple-100 text-purple-700 rounded hover:bg-purple-200 flex items-center text-sm"
                  onClick={copyToClipboard}
                >
                  <Clipboard className="w-3 h-3 mr-1" /> Copy
                </button>
              </div>


            </>
          )}

        </div>
      </div>


      {/* Filters Section */}
      {showFilters && (
        <div className="py-3 px-3 sm:px-6 bg-gray-50 border-b border-gray-200">
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 mr-2">Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 mr-2">Manufacturer</label>
              <select
                name="manufacturer"
                value={filters.manufacturer}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Manufacturers</option>
                {getUniqueManufacturers().map(mfr => (
                  <option key={mfr} value={mfr}>{mfr}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 mr-2">Vendor</label>
              <select
                name="vendor"
                value={filters.vendor}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Vendors</option>
                {getUniqueVendors().map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 mr-2">Min Stock</label>
              <input
                type="number"
                name="minStock"
                value={filters.minStock}
                onChange={handleFilterChange}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
              />
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium text-gray-700 mr-2">Max Stock</label>
              <input
                type="number"
                name="maxStock"
                value={filters.maxStock}
                onChange={handleFilterChange}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
              />
            </div>

            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Loading and Error States */}
      {isLoading && (
        <div className="p-8  text-center">
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
        // <div className="bg-gray px-4 py-3 flex items-center justify-between border-t border-gray-200">

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="ml-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("id")}>
                  ID {renderSortIndicator("id")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Image
                </th>

                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("partname")}
                >
                  Part NAME{renderSortIndicator("partname")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("manufacturerpart")}
                >
                  MANUFACTURER Part # {renderSortIndicator("manufacturerpart")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("vendor")}
                >
                  Vendor {renderSortIndicator("vendor")}
                </th>

                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("category")}
                >
                  Category {renderSortIndicator("category")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("description")}
                >
                  Description {renderSortIndicator("description")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("stock")}
                >
                  In-Stock {renderSortIndicator("stock")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort("bin")}
                >
                  Bin {renderSortIndicator("bin")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-2 sm:px-4 py-8 text-center text-gray-500">
                    No inventory items found. Try adjusting your filters or adding new items.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={index} className="hover:bg-gray-50">{/* Remove whitespace */}
                    <td className="px-2 sm:px-4 py-3 whitespace-nowrap">
                      <input
                        type="checkbox"
                        checked={selectedItems.includes(item.manufacturerPart)}
                        onChange={() => handleSelectItem(item.manufacturerPart)}
                        className="ml-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.id || "N/A"}</td>
                    <td className="px-4 py-3">
                      <ImagePreview
                        url={getImageUrl(item)}
                        alt={item.partName || item.manufacturerPart}
                        handleClick={() => handleImageClick(getImageUrl(item), item.partName || item.manufacturerPart)}
                      />
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <Link href={`/product/${encodeURIComponent(item.manufacturerPart)}`} className="text-blue-600 hover:underline cursor-pointer">
                        {item.partName || item.manufacturerPart || "N/A"}
                      </Link>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.manufacturerPart}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.vendor || "N/A"}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.category || "Uncategorized"}</td>
                    <td className="px-4 py-3">{item.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap">{item.avl_quantity}</td>
                    <td className="px-4 py-3">
                      <div className="inline-block">
                        {item.binLocations && Array.isArray(item.binLocations) ? (
                          <div className="grid grid-cols-2 gap-1 auto-cols-min">
                            {item.binLocations.map((location, idx) => (
                              <span key={`${location.bin}-${idx}`} className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium bg-gray-100 text-gray-800" title={`Quantity: ${location.quantity}`}>
                                {location.bin} ({location.quantity})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span className="text-gray-500">No bin assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button className="text-blue-600 hover:text-blue-800" onClick={() => openPdfModal(item)}>
                          <FileSpreadsheet className="h-5 w-5" />
                        </button>
                        <Link href={`/product/${encodeURIComponent(item.manufacturerPart)}?editMode=true`}>
                          <Edit className="text-blue-600 hover:text-blue-800 w-5 h-5" />
                        </Link>
                        <button className="text-red-600 hover:text-red-800" onClick={() => handleDeleteItem(item.manufacturerPart)}>
                          <Trash className="h-5 w-5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      )
      }

      {/* Stats Footer */}
      <div className="bg-gray-50 px-4 py-3 flex items-center justify-between border-t border-gray-200">
        <div className="text-sm text-gray-600">
          Showing <span className="font-medium">{filteredItems.length}</span> of <span className="font-medium">{inventoryItems.length}</span> items
          {selectedItems.length > 0 && (
            <span> | <span className="font-medium">{selectedItems.length}</span> selected</span>
          )}
        </div>
        <div className="text-sm text-gray-600" >
          <TimeStamp />

        </div>
      </div>
      <ImageModal
        isOpen={modalOpen}
        imageUrl={selectedImage.url}
        altText={selectedImage.alt}
        onClose={() => setModalOpen(false)}
      />
      {/* PDF Modal */}
      <PdfViewerModal
        isOpen={isPdfModalOpen}
        pdfUrl={pdfUrl}
        onClose={closePdfModal}
      />
    </div >

  );
};

export default ManageInventory;
