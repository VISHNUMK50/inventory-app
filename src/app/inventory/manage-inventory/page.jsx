"use client";
import { useState, useEffect, useRef } from "react";
import { Search, Edit, Trash, Download, AlertCircle, X, FileSpreadsheet, PlusCircle, Filter, RefreshCw, ChevronDown, Store, Clipboard } from "lucide-react";
import Link from "next/link";
import githubConfigImport from '@/config/githubConfig';
import { fetchInventoryFromGitHub } from "@/app/api/fetchInventoryFromGitHub";

import TimeStamp from '@/components/TimeStamp';
import { doc, getDoc, } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
const ManageInventory = () => {
  // State for inventory items

  useEffect(() => {
  // On mount, read preference
  const saved = localStorage.getItem('darkMode');
  if (saved === '1') {
    document.documentElement.classList.add('dark');
  } else {
    document.documentElement.classList.remove('dark');
  }
}, []);

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
    vendor: "",
    minStock: "",
    maxStock: ""
  });

  const [githubConfig, setGithubConfig] = useState(githubConfigImport);
  const [config, setConfig] = useState(githubConfig);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [userDatasheet, setUserDatasheet] = useState(null);
  useEffect(() => {
    // console.log("useEffect (onAuthStateChanged) - githubConfig before:", githubConfig);

    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      // console.log("Auth state changed. Current user:", currentUser);
      if (!currentUser) {
        setConfigLoaded(true);
        return;
      }
      const fetchUserConfig = async () => {
        const docId = currentUser.email.replace(/\./g, "_");
        // console.log("Firestore docId:", docId);
        const userDoc = await getDoc(doc(db, "users", docId));
        // console.log("userDoc.exists():", userDoc.exists());
        let config = githubConfigImport;
        if (userDoc.exists()) {
          const data = userDoc.data();
          // console.log("Firestore user data:", data);
          if (data.githubConfig) {
            config = {
              ...githubConfigImport,
              ...data.githubConfig,
              token: data.githubConfig.token || githubConfigImport.token,
            };
            const username = currentUser.displayName || currentUser.email.split('@')[0] || "user";
            const uid = currentUser.uid || "nouid";
            config.path = `${username}-${uid}/db`;
            config.datasheets = `${username}-${uid}/db/datasheets`;
            // console.log("githubConfig from Firestore (with dynamic path):", config);
          }
          if (data.datasheet) setUserDatasheet(data.datasheet);
        }
        setGithubConfig(config);
        setConfig(config);

        setConfigLoaded(true);
        // console.log("useEffect (onAuthStateChanged) - githubConfig after set:", config);

      };
      fetchUserConfig();
    });
    return () => unsubscribe();
  }, []);



  // Fetch inventory items on component mount
  useEffect(() => {
    if (configLoaded) {
      fetchInventoryItems();
    }
  }, [configLoaded]);

  // Apply filters and search when inventory items, search term, or filters change
  useEffect(() => {
    // console.log("Inventory items after fetch:", inventoryItems);
    if (inventoryItems.length > 0) {
      applyFiltersAndSearch();
    }
  }, [inventoryItems, searchTerm, filters, viewMode, sortField, sortDirection]);

  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      // console.log('Inventory updated, refreshing data...');
      fetchInventoryData(true);
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, []);

  useEffect(() => {
    const handleInventoryUpdate = (event) => {
      // console.log('Inventory updated, refreshing data...');
      fetchInventoryData(true);
    };

    window.addEventListener('inventoryUpdated', handleInventoryUpdate);
    return () => window.removeEventListener('inventoryUpdated', handleInventoryUpdate);
  }, []);

  const fetchInventoryItems = async () => {
    setIsLoading(true);
    setError(null);

    try {
      const items = await fetchInventoryFromGitHub(config);
      setInventoryItems(items);
      setFilteredItems(items);
    } catch (error) {
      setError(error.message);
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
    // console.log("Filtered items:", result); // Move this line here

    setFilteredItems(result);
  };

  // Function to move file to recycle bin
  const moveToRecycleBin = async (itemId) => {
    const { token, repo, owner, path } = config;

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

        if (!config.token || !config.repo || !config.owner) {
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
  const searchTimeout = useRef();
  const handleSearchChange = (e) => {
    const value = e.target.value;
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => {
      setSearchTerm(value);
    }, 300); // 300ms debounce
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
    const { owner, repo } = config;
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
            // console.log(`Image error for: ${imgSrc}`);
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
                // console.log(`Modal image error for: ${imgSrc}`);
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



  return (
    <div className="mx-auto shadow-xl overflow-hidden" style={{ background: "var(--background)", color: "var(--foreground)", minHeight: "100vh" }}>
      {/* Main header - with class for targeting */}

      {/* Fixed position action bar with a placeholder for when it's fixed */}
      <div className={`${scrolled ? 'fixed top-0 left-0 right-0 z-50 shadow-md' : 'relative'} shadow-md py-1 px-3 sm:px-6`}
        style={{
          background: "var(--bar-bg)",
          borderBottom: "1px solid var(--border)"
        }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-2 sm:space-y-0 sm:space-x-4">
          <h2 className="text-2xl font-bold flex items-center"
            style={{
              color: "var(--bar-text)",
              letterSpacing: "0.01em"
            }}
          >
            <Store className="mr-2 h-5 w-5" style={{ color: "var(--bar-text)" }} /> Manage Products
          </h2>

          <div className="flex flex-wrap items-center gap-1 sm:gap-2 justify-between ">
            <button
              className="p-2 rounded flex items-center"
              style={{
                background: "var(--accent-foreground)",
                color: "var(--accent)",
                border: "1px solid var(--accent)"
              }}
              onClick={() => setShowFilters(!showFilters)}
              title="Filter"
            >
              <Filter className="w-4 h-4" />
            </button>

            <button
              className="p-2 rounded flex items-center"
              style={{
                background: "var(--accent)",
                color: "#fff"
              }}
              onClick={fetchInventoryItems}
              title="Refresh"
            >
              <RefreshCw className="w-4 h-4" />
            </button>

            <div className="relative">
              <button
                className="p-2 rounded flex items-center"
                style={{
                  background: "var(--card)",
                  color: "var(--foreground)",
                  border: "1px solid var(--border)"
                }}
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
                    className="px-3 py-1 rounded flex items-center text-sm"
                    style={{
                      background: "var(--danger)",
                      color: "#fff"
                    }}
                    onClick={deleteSelectedItems}
                  >
                    <Trash className="w-3 h-3 mr-1" /> Delete
                  </button>

                  <button
                    className="px-3 py-1 rounded flex items-center text-sm"
                    style={{
                      background: "var(--success)",
                      color: "#fff"
                    }}
                    onClick={exportToCSV}
                  >
                    <Download className="w-3 h-3 mr-1" /> Export
                  </button>

                  <button
                    className="px-3 py-1 rounded flex items-center text-sm"
                    style={{
                      background: "var(--section-purple)",
                      color: "var(--section-purple-text)"
                    }}
                    onClick={copyToClipboard}
                  >
                    <Clipboard className="w-3 h-3 mr-1" /> Copy
                  </button>
                </>
              )}
            </div>

            <div className="relative flex-1 min-w-[120px] max-w-xs sm:max-w-xs md:max-w-sm lg:max-w-md">
              <input
                type="text"
                placeholder="Search..."
                value={searchTerm}
                onChange={handleSearchChange}
                className="pl-8 pr-3 py-1.5 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500 w-full text-sm transition-all"
                style={{
                  background: "var(--card)",
                  color: "var(--foreground)"
                }}
              />
              <Search className="w-4 h-4 absolute left-2 top-2.5" style={{ color: "var(--border)" }} />
            </div>

            <Link href="/add-product">
              <button
                className="px-2 py-2 sm:py-1 rounded flex items-center"
                style={{
                  background: "var(--accent)",
                  color: "#fff"
                }}
              >
                <PlusCircle className="w-4 h-4" />
                <span className="hidden sm:block ml-2">Add Product</span>
              </button>
            </Link>
          </div>
          {selectedItems.length > 0 && (
            <>
              {/* For small screens */}
              <div className="flex flex-row gap-2 sm:hidden">
                <button
                  className="px-3 py-1 rounded flex items-center text-sm"
                  style={{
                    background: "var(--danger)",
                    color: "#fff"
                  }}
                  onClick={deleteSelectedItems}
                >
                  <Trash className="w-3 h-3 mr-1" /> Delete
                </button>

                <button
                  className="px-3 py-1 rounded flex items-center text-sm"
                  style={{
                    background: "var(--success)",
                    color: "#fff"
                  }}
                  onClick={exportToCSV}
                >
                  <Download className="w-3 h-3 mr-1" /> Export
                </button>

                <button
                  className="px-3 py-1 rounded flex items-center text-sm"
                  style={{
                    background: "var(--section-purple)",
                    color: "var(--section-purple-text)"
                  }}
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
        <div className="py-3 px-3 sm:px-6"
          style={{
            background: "var(--section-gray)",
            borderBottom: "1px solid var(--border)"
          }}
        >
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center">
              <label className="text-xs font-medium mr-2" style={{ color: "var(--section-indigo-label)" }}>Category</label>
              <select
                name="category"
                value={filters.category}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  background: "var(--section-indigo)",
                  color: "var(--section-indigo-text)"
                }}
              >
                <option value="">All Categories</option>
                {getUniqueCategories().map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium mr-2" style={{ color: "var(--section-pink-label)" }}>Manufacturer</label>
              <select
                name="manufacturer"
                value={filters.manufacturer}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  background: "var(--section-pink)",
                  color: "var(--section-pink-text)"
                }}
              >
                <option value="">All Manufacturers</option>
                {getUniqueManufacturers().map(mfr => (
                  <option key={mfr} value={mfr}>{mfr}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="text-xs font-medium mr-2" style={{ color: "var(--section-pink-label)" }}>Vendor</label>
              <select
                name="vendor"
                value={filters.vendor}
                onChange={handleFilterChange}
                className="w-44 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                style={{
                  background: "var(--section-pink)",
                  color: "var(--section-pink-text)"
                }}
              >
                <option value="">All Vendors</option>
                {getUniqueVendors().map(vendor => (
                  <option key={vendor} value={vendor}>{vendor}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center">
              <label className="text-xs font-medium mr-2" style={{ color: "var(--section-green-label)" }}>Min Stock</label>
              <input
                type="number"
                name="minStock"
                value={filters.minStock}
                onChange={handleFilterChange}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                style={{
                  background: "var(--section-green)",
                  color: "var(--section-green-text)"
                }}
              />
            </div>

            <div className="flex items-center">
              <label className="text-xs font-medium mr-2" style={{ color: "var(--section-green-label)" }}>Max Stock</label>
              <input
                type="number"
                name="maxStock"
                value={filters.maxStock}
                onChange={handleFilterChange}
                className="w-20 px-2 py-1 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                min="0"
                style={{
                  background: "var(--section-green)",
                  color: "var(--section-green-text)"
                }}
              />
            </div>

            <button
              onClick={resetFilters}
              className="px-3 py-1 text-sm rounded"
              style={{
                background: "var(--yellow-bg)",
                color: "var(--warning)",
                border: "1px solid var(--yellow-border)"
              }}
            >
              Reset
            </button>
          </div>
        </div>
      )}

      {/* Loading and Error States */}
      {isLoading && (
        <div className="p-8 text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-700 mx-auto mb-4"></div>
          <p style={{ color: "var(--foreground)", opacity: 0.7 }}>Loading inventory data...</p>
        </div>
      )}

      {error && !isLoading && (
        <div className="p-6 flex items-center justify-center" style={{ background: "var(--danger)", color: "#fff" }}>
          <AlertCircle className="w-5 h-5 mr-2" />
          <p>Error loading inventory: {error}</p>
        </div>
      )}

      {/* Inventory Table */}
      {!isLoading && !error && (
        <div className="overflow-x-auto" style={{ background: "var(--card)" }}>
          <table className="min-w-full divide-y" style={{ borderColor: "var(--border)" }}>
            <thead style={{ background: "var(--section-gray)" }}>
              <tr>
                <th className="px-2 sm:px-4 py-3 text-left">
                  <input
                    type="checkbox"
                    checked={selectAll}
                    onChange={handleSelectAll}
                    className="ml-3 h-4 w-4 text-blue-600 rounded border-gray-300 focus:ring-blue-500"
                  />
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-indigo-label)" }}
                  onClick={() => handleSort("id")}>
                  ID {renderSortIndicator("id")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--section-indigo-label)" }}>
                  Image
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-indigo-label)" }}
                  onClick={() => handleSort("partname")}
                >
                  Part NAME{renderSortIndicator("partname")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-pink-label)" }}
                  onClick={() => handleSort("manufacturerpart")}
                >
                  MANUFACTURER Part # {renderSortIndicator("manufacturerpart")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-pink-label)" }}
                  onClick={() => handleSort("vendor")}
                >
                  Vendor {renderSortIndicator("vendor")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-indigo-label)" }}
                  onClick={() => handleSort("category")}
                >
                  Category {renderSortIndicator("category")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-green-label)" }}
                  onClick={() => handleSort("description")}
                >
                  Description {renderSortIndicator("description")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-green-label)" }}
                  onClick={() => handleSort("stock")}
                >
                  In-Stock {renderSortIndicator("stock")}
                </th>
                <th
                  className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider cursor-pointer"
                  style={{ color: "var(--section-purple-label)" }}
                  onClick={() => handleSort("bin")}
                >
                  Bin {renderSortIndicator("bin")}
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider"
                  style={{ color: "var(--foreground)" }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody style={{ background: "var(--card)" }}>
              {filteredItems.length === 0 ? (
                <tr>
                  <td colSpan="11" className="px-2 sm:px-4 py-8 text-center" style={{ color: "var(--border)" }}>
                    No inventory items found. Try adjusting your filters or adding new items.
                  </td>
                </tr>
              ) : (
                filteredItems.map((item, index) => (
                  <tr key={index} style={{ background: "var(--card)" }} className="hover:bg-blue-50">
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
                      <Link href={`/product/${encodeURIComponent(item.manufacturerPart)}`} style={{ color: "var(--accent)" }} className="hover:underline cursor-pointer">
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
                              <span key={`${location.bin}-${idx}`} className="inline-flex items-center px-2 py-1.5 rounded text-xs font-medium"
                                style={{
                                  background: "var(--section-purple)",
                                  color: "var(--section-purple-text)"
                                }}
                                title={`Quantity: ${location.quantity}`}>
                                {location.bin} ({location.quantity})
                              </span>
                            ))}
                          </div>
                        ) : (
                          <span style={{ color: "var(--border)" }}>No bin assigned</span>
                        )}
                      </div>
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap">
                      <div className="flex items-center space-x-3">
                        <button className="hover:underline" style={{ color: "var(--accent)" }} onClick={() => openPdfModal(item)}>
                          <FileSpreadsheet className="h-5 w-5" />
                        </button>
                        <Link href={`/product/${encodeURIComponent(item.manufacturerPart)}?editMode=true`}>
                          <Edit className="w-5 h-5" style={{ color: "var(--accent)" }} />
                        </Link>
                        <button className="hover:underline" style={{ color: "var(--danger)" }} onClick={() => handleDeleteItem(item.manufacturerPart)}>
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
      )}

      {/* Stats Footer */}
      <div style={{ background: "var(--section-gray)", borderTop: "1px solid var(--border)" }} className="px-4 py-3 flex items-center justify-between">
        <div className="text-sm" style={{ color: "var(--foreground)" }}>
          Showing <span className="font-medium">{filteredItems.length}</span> of <span className="font-medium">{inventoryItems.length}</span> items
          {selectedItems.length > 0 && (
            <span> | <span className="font-medium">{selectedItems.length}</span> selected</span>
          )}
        </div>
        <div className="text-sm" style={{ color: "var(--foreground)" }}>
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
    </div>
  );
};

export default ManageInventory;
