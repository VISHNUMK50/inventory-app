"use client";
import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import {
  ChevronDown, PlusCircle, ArrowLeft, Save, Package, Clipboard, X, MapPin, FileText, Download, Eye, FileX, RefreshCw, Tag, Edit, Folder, Trash, DollarSign, AlertCircle, ClipboardList, Home
} from "lucide-react";
import githubConfigImport from '@/config/githubConfig';
import TimeStamp from '@/components/TimeStamp';
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import {
  safeBase64Encode,
  batchCommitToGithub
} from "@/utils/githubApi";

export default function ProductDetail({ params }) {
  // --- PARAMS ---
  const resolvedParams = typeof params?.then === "function" ? React.use(params) : params;
  const partName = resolvedParams?.partName ? decodeURIComponent(resolvedParams.partName) : null;
  const searchParams = typeof window !== "undefined" ? new URLSearchParams(window.location.search) : null;
  const shouldEditMode = searchParams?.get('editMode') === 'true';

  // --- STATE ---
  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(shouldEditMode);
  const [editedProduct, setEditedProduct] = useState({ binLocations: [] });
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [datasheetName, setDatasheetName] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const [config, setConfig] = useState(githubConfigImport);
  const [configLoaded, setConfigLoaded] = useState(false);
  const [dropdownOptions, setDropdownOptions] = useState({
    partNames: [],
    manufacturers: [],
    vendors: [],
    manufacturerParts: [],
    categories: []
  });
  const [showDropdown, setShowDropdown] = useState({});
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [suggestions, setSuggestions] = useState({
    partName: [],
    manufacturer: [],
    vendor: [],
    manufacturerPart: [],
    category: [],
  });
  const [newEntries, setNewEntries] = useState({
    partName: "",
    manufacturer: "",
    vendor: "",
    manufacturerPart: "",
    category: "",
  });
  const [addingField, setAddingField] = useState(null);

  const dropdownRefs = {
    partName: useRef(null),
    manufacturer: useRef(null),
    vendor: useRef(null),
    manufacturerPart: useRef(null),
    category: useRef(null),
  };
  const inputRefs = {
    partName: useRef(null),
    manufacturer: useRef(null),
    vendor: useRef(null),
    manufacturerPart: useRef(null),
    category: useRef(null),
  };

  // --- AUTOCOMPLETE ---
  const updateSuggestions = (field, value) => {
    const options = field === "category" ? dropdownOptions.categories : dropdownOptions[`${field}s`] || [];
    setSuggestions(prev => ({
      ...prev,
      [field]: options.filter(opt => opt.toLowerCase().includes(value.toLowerCase()) && value)
    }));
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
    updateSuggestions(name, value);
  };

  const handleSelectSuggestion = (field, value) => {
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    setActiveDropdown(null);
  };

  const openDropdown = (field) => {
    setActiveDropdown(field);
    updateSuggestions(field, editedProduct[field] || "");
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntries(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const addNewEntry = (field) => {
    const value = newEntries[field];
    if (!value) return;
    setDropdownOptions(prev => ({
      ...prev,
      [`${field}s`]: [...(prev[`${field}s`] || []), value]
    }));
    setEditedProduct(prev => ({
      ...prev,
      [field]: value
    }));
    setNewEntries(prev => ({ ...prev, [field]: "" }));
    setAddingField(null);
  };

  // --- DROPDOWN CLOSE HANDLER ---
  useEffect(() => {
    function handleClickOutside(event) {
      const isOutsideAllDropdowns =
        Object.keys(dropdownRefs).every(field =>
          !dropdownRefs[field].current ||
          !dropdownRefs[field].current.contains(event.target)
        );
      const isOnInputField =
        Object.keys(inputRefs).some(field =>
          inputRefs[field].current &&
          inputRefs[field].current.contains(event.target)
        );
      if (isOutsideAllDropdowns && !isOnInputField) {
        setSuggestions({
          partName: [],
          manufacturer: [],
          vendor: [],
          manufacturerPart: [],
          category: []
        });
        setActiveDropdown(null);
        setShowDropdown({});
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // --- GITHUB CONFIG LOGIC (per-user) ---
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      if (!currentUser) {
        setConfigLoaded(true);
        return;
      }
      const fetchUserConfig = async () => {
        const docId = currentUser.email.replace(/\./g, "_");
        const userDoc = await getDoc(doc(db, "users", docId));
        let userConfig = githubConfigImport;
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.githubConfig) {
            userConfig = {
              ...githubConfigImport,
              ...data.githubConfig,
              token: data.githubConfig.token || githubConfigImport.token,
            };
            const username = currentUser.displayName || currentUser.email.split('@')[0] || "user";
            const uid = currentUser.uid || "nouid";
            userConfig.path = `${username}-${uid}/db`;
            userConfig.datasheets = `${username}-${uid}/db/datasheets`;
          }
        }
        setConfig(userConfig);
        setConfigLoaded(true);
      };
      fetchUserConfig();
    });
    return () => unsubscribe();
  }, []);

  // --- UTILS ---
  const calculateTotalQuantity = (binLocations) =>
    Array.isArray(binLocations)
      ? binLocations.reduce((total, location) => total + (parseInt(location.quantity) || 0), 0)
      : 0;

  // --- DROPDOWN OPTIONS ---
  useEffect(() => {
    if (configLoaded) fetchDropdownOptionsFromGithub();
    // eslint-disable-next-line
  }, [configLoaded]);

  const fetchDropdownOptionsFromGithub = async () => {
    try {
      const { token, repo, owner, path } = config;
      if (!token || !repo || !owner) return;
      const optionsFilePath = `${path}/dropdownOptions.json`;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;
      const response = await fetch(apiUrl, {
        headers: { "Authorization": `token ${token}` }
      });
      if (!response.ok) return;
      const data = await response.json();
      const options = JSON.parse(atob(data.content));
      if (!options.manufacturerParts) options.manufacturerParts = [];
      setDropdownOptions(options);
    } catch (error) {
      // silent fail
    }
  };

  // --- PRODUCT FETCH ---
  useEffect(() => {
    if (configLoaded && partName) fetchProductDetails(partName);
    else if (!partName) {
      setError("No product specified");
      setIsLoading(false);
    }
    // eslint-disable-next-line
  }, [configLoaded, partName]);

  const fetchProductDetails = async (partNum) => {
    setIsLoading(true);
    setError(null);
    try {
      const { token, repo, owner, path } = config;
      if (!token || !repo || !owner) {
        setIsLoading(false);
        return;
      }
      const jsonDirPath = `${path}/jsons`;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonDirPath}`;
      const response = await fetch(apiUrl, {
        headers: { "Authorization": `token ${token}` }
      });
      if (!response.ok) throw new Error(`GitHub API error: ${response.statusText} (${response.status})`);
      const files = await response.json();
      let productFile = files.find(file =>
        file.type === "file" &&
        file.name.endsWith(".json") &&
        file.name.includes(`${partNum}`)
      );
      if (productFile) {
        const fileContent = await (await fetch(productFile.download_url)).json();
        setProduct(fileContent);
        setEditedProduct({ ...fileContent, binLocations: fileContent.binLocations || [] });
      } else {
        let productFound = false;
        for (const file of files) {
          if (file.type === "file" && file.name.endsWith(".json")) {
            try {
              const fileContent = await (await fetch(file.download_url)).json();
              if (fileContent.manufacturerPart === partNum || fileContent.partName === partNum) {
                setProduct(fileContent);
                setEditedProduct({ ...fileContent, binLocations: fileContent.binLocations || [] });
                productFound = true;
                break;
              }
            } catch { }
          }
        }
        if (!productFound) setError("Product not found");
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  // --- FORM HANDLERS ---
  useEffect(() => {
    if (product) {
      setEditedProduct({ ...product, binLocations: product.binLocations || [] });
      setImagePreview(product.image);
      setDatasheetName(product.datasheet ? product.datasheet.split("/").pop() : null);
    }
  }, [product]);

  useEffect(() => {
    if (editedProduct) {
      setEditedProduct(prev => ({
        ...prev,
        quantity: calculateTotalQuantity(prev.binLocations)
      }));
    }
    // eslint-disable-next-line
  }, [editedProduct?.binLocations]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'quantity') return;
    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setImagePreview(URL.createObjectURL(file));
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result.split(',')[1];
      setEditedProduct(prev => ({
        ...prev,
        image: file.name,
        imageData: base64Data,
        imageType: file.type,
        imageModified: true
      }));
    };
    reader.readAsDataURL(file);
  };

  const handleDatasheetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setDatasheetName(file.name);
    const reader = new FileReader();
    reader.onload = (event) => {
      const base64Data = event.target.result.split(',')[1];
      setEditedProduct(prev => ({
        ...prev,
        datasheet: file.name,
        datasheetData: base64Data,
        datasheetType: file.type,
        datasheetModified: true
      }));
    };
    reader.readAsDataURL(file);
  };

  // --- PDF MODAL ---
  const openPdfModal = (url) => {
    setPdfUrl(url);
    setIsPdfModalOpen(true);
  };
  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfUrl("");
  };
  const PdfViewerModal = ({ isOpen, pdfUrl, onClose }) => {
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState(null);
    const getViewerUrl = (url) =>
      `https://docs.google.com/viewer?url=${encodeURIComponent(url)}&embedded=true`;
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

  // --- SAVE CHANGES ---
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);
    try {
      const { token, repo, owner, path, branch = 'main' } = config;
      const productToSave = {
        ...editedProduct,
        id: product.id,
        lastModified: new Date().toISOString()
      };

      const fileUpdates = [];

      // Compute old and new JSON filenames
      const oldSanitizedManufacturerPart = product.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
      const oldSanitizedPartName = product.partName.replace(/[^a-z0-9():\s]/gi, "_").replace(/\s+/g, "_");
      const oldJsonFileName = `${product.id}-${oldSanitizedPartName}-${oldSanitizedManufacturerPart}.json`;
      const oldJsonFilePath = `${path}/jsons/${oldJsonFileName}`;

      const newSanitizedManufacturerPart = productToSave.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
      const newSanitizedPartName = productToSave.partName.replace(/[^a-z0-9():\s]/gi, "_").replace(/\s+/g, "_");
      const newJsonFileName = `${productToSave.id}-${newSanitizedPartName}-${newSanitizedManufacturerPart}.json`;
      const newJsonFilePath = `${path}/jsons/${newJsonFileName}`;

      // If filename changed, delete the old JSON file
      if (oldJsonFilePath !== newJsonFilePath) {
        const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${oldJsonFilePath}`;
        const resp = await fetch(apiUrl, {
          headers: { "Authorization": `token ${token}` }
        });
        if (resp.ok) {
          const fileData = await resp.json();
          await fetch(apiUrl, {
            method: "DELETE",
            headers: {
              "Authorization": `token ${token}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              message: `Delete old product file ${oldJsonFileName}`,
              sha: fileData.sha,
              branch
            })
          });
        }
      }

      // --- DELETE OLD IMAGE IF CHANGED ---
      if (
        product.image &&
        productToSave.image &&
        product.image !== productToSave.image &&
        product.image.startsWith("https://") // Only delete if it's a GitHub URL
      ) {
        // Extract old image filename
        const oldImageUrl = product.image;
        const oldImagePath = decodeURIComponent(
          oldImageUrl.split(`/${owner}/${repo}/${branch}/`)[1] || ""
        );
        if (oldImagePath) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${oldImagePath}`;
          const resp = await fetch(apiUrl, {
            headers: { "Authorization": `token ${token}` }
          });
          if (resp.ok) {
            const fileData = await resp.json();
            await fetch(apiUrl, {
              method: "DELETE",
              headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                message: `Delete old image file ${oldImagePath}`,
                sha: fileData.sha,
                branch
              })
            });
          }
        }
      }

      // --- DELETE OLD DATASHEET IF CHANGED ---
      if (
        product.datasheet &&
        productToSave.datasheet &&
        product.datasheet !== productToSave.datasheet &&
        product.datasheet.startsWith("https://")
      ) {
        const oldDatasheetUrl = product.datasheet;
        const oldDatasheetPath = decodeURIComponent(
          oldDatasheetUrl.split(`/${owner}/${repo}/${branch}/`)[1] || ""
        );
        if (oldDatasheetPath) {
          const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${oldDatasheetPath}`;
          const resp = await fetch(apiUrl, {
            headers: { "Authorization": `token ${token}` }
          });
          if (resp.ok) {
            const fileData = await resp.json();
            await fetch(apiUrl, {
              method: "DELETE",
              headers: {
                "Authorization": `token ${token}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                message: `Delete old datasheet file ${oldDatasheetPath}`,
                sha: fileData.sha,
                branch
              })
            });
          }
        }
      }

      // Handle image upload
      if (productToSave.imageModified && productToSave.imageData) {
        const itemIdentifier = `${productToSave.id}-${newSanitizedPartName}-${newSanitizedManufacturerPart}`;
        const imageFilePath = `${path}/images/${itemIdentifier}_${productToSave.image}`;
        fileUpdates.push({
          path: imageFilePath,
          content: productToSave.imageData,
        });
        productToSave.image = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imageFilePath}`;
        delete productToSave.imageData;
        delete productToSave.imageModified;
      }

      // Handle datasheet upload
      if (productToSave.datasheetModified && productToSave.datasheetData) {
        const itemIdentifier = `${productToSave.id}-${newSanitizedPartName}-${newSanitizedManufacturerPart}`;
        const datasheetFilePath = `${path}/datasheets/${itemIdentifier}_${productToSave.datasheet}`;
        fileUpdates.push({
          path: datasheetFilePath,
          content: productToSave.datasheetData,
        });
        productToSave.datasheet = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${datasheetFilePath}`;
        delete productToSave.datasheetData;
        delete productToSave.datasheetModified;
      }

      // Always save the product JSON with the new name
      fileUpdates.push({
        path: newJsonFilePath,
        content: safeBase64Encode(JSON.stringify(productToSave, null, 2)),
      });

      // Commit all files in one batch
      if (token && repo && owner && fileUpdates.length > 0) {
        await batchCommitToGithub({
          token,
          repo,
          owner,
          branch,
          fileUpdates,
          commitMessage: "Update product information and assets"
        });
      }

      setProduct(productToSave);
      setEditMode(false);
    } catch (error) {
      setSaveError(error.message || "Failed to save changes");
    } finally {
      setIsSaving(false);
    }
  };

  // --- AUTOCOMPLETE RENDER ---
  const renderAutocomplete = (field, label, required = false) => {
    const isCategory = field === "category";
    const options = isCategory ? dropdownOptions.categories : dropdownOptions[`${field}s`] || [];
    return (
      <div>
        <label className="block text-sm font-medium mb-1"
          style={{
            // Use section color if in a section, fallback to accent/foreground
            color:
              field === "partName" || field === "category"
                ? "var(--section-indigo-label, #6366f1)"
                : field === "manufacturer" || field === "manufacturerPart" || field === "vendor"
                  ? "var(--section-pink-label, #fbcfe8)"
                  : "var(--foreground)"
          }}>
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative flex items-center border border-gray-300 rounded-md ">
          {addingField === field ? (
            <div className="flex items-center w-full">
              <input
                type="text"
                id={`new-${field}`}
                name={field}
                value={newEntries[field]}
                onChange={handleNewEntryChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder={`Enter new ${field}`}
              />
              <button
                type="button"
                onClick={() => addNewEntry(field)}
                className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
              >
                Add
              </button>
            </div>
          ) : (
            <>
              <div className="relative w-full border-r border-r-gray-300" ref={dropdownRefs[field]}>
                <input
                  type="text"
                  name={field}
                  ref={inputRefs[field]}
                  value={editedProduct[field] || ""}
                  onChange={handleChange}
                  onFocus={() => openDropdown(field)}
                  required={required}
                  className="autocomplete-input w-full px-3 py-2  rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder={`Type to search or select ${label.toLowerCase()}`}
                  autoComplete="off"
                />
                {activeDropdown === field && suggestions[field] && suggestions[field].length > 0 && (
                  <div className="dropdown-suggestions absolute z-10 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {suggestions[field].map((item, index) => (
                      <div
                        key={index}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => handleSelectSuggestion(field, item)}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
                {showDropdown[field] && (
                  <div className="dropdown-suggestions absolute z-20 w-full bg-white mt-1 border border-gray-300 rounded-md shadow-lg max-h-60 overflow-auto">
                    {options.map((item, idx) => (
                      <div
                        key={idx}
                        className="px-4 py-2 hover:bg-blue-50 cursor-pointer"
                        onClick={() => {
                          setEditedProduct(prev => ({ ...prev, [field]: item }));
                          setShowDropdown(prev => ({ ...prev, [field]: false }));
                        }}
                      >
                        {item}
                      </div>
                    ))}
                  </div>
                )}
              </div>
              <button
                type="button"
                tabIndex={-1}
                className=" p-2 "
                onClick={() => setShowDropdown(prev => ({ ...prev, [field]: !prev[field] }))}
                aria-label="Show all options"
              >
                <ChevronDown className="h-4 w-4 text-gray-400 " />
              </button>
            </>
          )}
        </div>
      </div>
    );
  };

  // --- RENDER ---
if (isLoading) {
  return (
    <div className="min-h-screen w-full flex flex-col bg-gray-50 dark:bg-black">
      <div className="flex-1 flex items-center justify-center">
        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] w-full
          bg-gradient-to-br from-indigo-50 to-blue-50 dark:from-black dark:to-gray-900">
          <div className="animate-spin rounded-full h-14 w-14 border-b-4 border-indigo-600 mb-6"></div>
          <p className="text-lg text-indigo-900 dark:text-indigo-200 font-medium">Loading product details...</p>
        </div>
      </div>
    </div>
  );
}
  if (error) {
    return (
      <div className="mx-auto bg-white shadow-xl overflow-hidden"
        style={{ color: "var(--foreground, #1f2937)", backgroundColor: "var(--background, #ffffff)" }}>

        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-red-50 to-red-100">
          <AlertCircle className="w-12 h-12 text-red-600 mb-4" />
          <p className="text-red-800 text-xl font-semibold">Error: {error}</p>
          <Link
            href="/manage-inventory"
            className="mt-6 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded shadow hover:from-blue-700 hover:to-indigo-800 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
          </Link>
        </div>
      </div>

    );
  }
  if (!product) {
    return (
      <div className="mx-auto bg-white shadow-xl overflow-hidden"
        style={{ color: "var(--foreground, #1f2937)", backgroundColor: "var(--background, #ffffff)" }}>

        <div className="p-8 flex flex-col items-center justify-center min-h-[300px] bg-gradient-to-br from-yellow-50 to-yellow-100">
          <AlertCircle className="w-12 h-12 text-yellow-500 mb-4" />
          <p className="text-yellow-700 text-xl font-semibold">Product not found or data is unavailable</p>
          <Link
            href="/manage-inventory"
            className="mt-6 px-5 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded shadow hover:from-blue-700 hover:to-indigo-800 flex items-center"
          >
            <ArrowLeft className="w-4 h-4 mr-2" /> Back to Inventory
          </Link>
        </div>
      </div>

    );
  }

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden"
      style={{ color: "var(--foreground, #1f2937)", backgroundColor: "var(--background, #ffffff)" }}>

      {/* Navigation and Action Buttons */}
      <div className="px-6 py-3 flex items-center justify-between border-b border-indigo-100"
        style={{ background: "var(--bar-bg )" }}>
        <Link href="/manage-inventory" className="flex items-center text-blue-700 hover:text-blue-900 font-semibold">
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Inventory
        </Link>

        <div className="flex items-center space-x-2">
          {!editMode ? (
            <>
              <button
                onClick={() => setEditMode(true)}
                className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded hover:from-blue-700 hover:to-indigo-800 flex items-center shadow"
              >
                <Edit className="w-4 h-4 mr-2" /> Edit
              </button>

              <button
                className="px-4 py-2 bg-gradient-to-r from-red-500 to-red-700 text-white rounded hover:from-red-600 hover:to-red-800 flex items-center shadow"
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
                className={`px-4 py-2 bg-gradient-to-r from-green-500 to-green-700 text-white rounded hover:from-green-600 hover:to-green-800 flex items-center shadow ${isSaving ? 'opacity-50 cursor-not-allowed' : ''}`}
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
                className="px-4 py-2 bg-gradient-to-r from-gray-400 to-gray-600 text-white rounded hover:from-gray-500 hover:to-gray-700 flex items-center shadow"
                disabled={isSaving}
              >
                Cancel
              </button>
            </>
          )}

          <button
            onClick={() => fetchProductDetails(partName)}
            className="px-4 py-2 bg-gradient-to-r from-blue-100 to-indigo-100 text-blue-800 rounded hover:from-blue-200 hover:to-indigo-200 flex items-center shadow"
          >
            <RefreshCw className="w-4 h-4 mr-2" /> Refresh
          </button>
        </div>
      </div>

      {/* Save Error Alert */}
      {saveError && (
        <div className="p-4 bg-gradient-to-r from-red-50 to-red-100 border-b border-red-200">
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
          <div className="rounded-lg">
            {/* Product Identification Section */}
            <div className="mb-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              <div
                className="p-4 rounded-lg shadow-md"
                style={{
                  background: "var(--section-indigo)",
                  color: "var(--section-indigo-text, #a5b4fc)",
                }}
              >
                <h3
                  className="font-semibold mb-3 flex items-center"
                  style={{
                    color: "var(--section-indigo-text, #a5b4fc)",
                    fontSize: "1.1rem",
                  }}
                >
                  <Tag className="mr-2 h-5 w-5" style={{ color: "var(--section-indigo-text, #a5b4fc)" }} />
                  Product Identification
                </h3>
                <div className="space-y-4">
                  {renderAutocomplete("partName", "Part Name", true)}
                  {renderAutocomplete("category", "Category", true)}
                  <div>
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-indigo-label, #c7d2fe)" }}>
                      Customer Reference
                    </label>
                    <textarea
                      name="customerRef"
                      value={editedProduct.customerRef}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Customer part reference"
                      style={{ background: "transparent", color: "var(--section-indigo-text, #a5b4fc)" }}
                    />
                  </div>
                </div>
              </div>
              {/* Manufacturer Details Section */}
              <div
                className="shadow-md p-4 rounded-lg md:col-span-1 lg:col-span-2"
                style={{
                  background: "var(--section-pink)",
                  color: "var(--section-pink-text, #f472b6)",
                }}
              >
                <h3
                  className="font-semibold mb-3 flex items-center"
                  style={{
                    color: "var(--section-pink-text, #f472b6)",
                    fontSize: "1.1rem",
                  }}
                >
                  <Folder className="mr-2 h-5 w-5" style={{ color: "var(--section-pink-text, #f472b6)" }} />
                  Manufacturer Details
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                    {renderAutocomplete("manufacturer", "Manufacturer", true)}
                    {renderAutocomplete("manufacturerPart", "Manufacturer Part #", true)}
                    {renderAutocomplete("vendor", "Vendor", false)}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-pink-label, #fbcfe8)" }}>
                        Vendor Product Link
                      </label>
                      <input
                        type="text"
                        name="vendorProductLink"
                        value={editedProduct.vendorProductLink || ''}
                        onChange={handleInputChange}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="https://vendor.com/product/123"
                        style={{ background: "transparent", color: "var(--section-pink-text, #f472b6)" }}
                      />
                    </div>
                  </div>
                  <div className="md:col-span-2">
                    <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-pink-label, #fbcfe8)" }}>
                      Description
                    </label>
                    <textarea
                      name="description"
                      value={editedProduct.description}
                      onChange={handleInputChange}
                      rows="2"
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="Brief description of the part"
                      style={{ background: "transparent", color: "var(--section-pink-text, #f472b6)" }}
                    />
                  </div>
                </div>
              </div>
            </div>
            {/* Pricing Information Section */}
            <div className="mb-4">
              <div
                className="p-4 rounded-lg shadow-md"
                style={{
                  background: "var(--section-green)",
                  color: "var(--section-green-text, #bbf7d0)",
                }}
              >
                <h3 className="font-semibold mb-3 flex items-center" style={{ color: "var(--section-green-text, #bbf7d0)", fontSize: "1.1rem" }}>
                  <DollarSign className="mr-2 h-5 w-5" style={{ color: "var(--section-green-text, #bbf7d0)" }} />
                  Pricing Information
                </h3>
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div>
                      <label className="block text-sm font-medium mb-1 flex items-center" style={{ color: "var(--section-green-label, #bbf7d0)" }}>
                        <DollarSign className="h-4 w-4 mr-1" />
                        Cost Price <span className="ml-1 text-red-500">*</span>
                      </label>
                      <input
                        type="number"
                        name="costPrice"
                        value={editedProduct.costPrice}
                        required={true}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        style={{ background: "transparent", color: "#fff" }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-green-label, #bbf7d0)" }}>
                        <div className="flex items-center">
                          <Tag className="h-4 w-4 mr-1" />
                          <span>Sale Price</span>
                        </div>
                      </label>
                      <input
                        type="number"
                        name="salePrice"
                        value={editedProduct.salePrice}
                        onChange={handleInputChange}
                        step="0.01"
                        min="0"
                        className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                        placeholder="0.00"
                        style={{ background: "transparent", color: "#fff" }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Inventory Details Section */}
            <div className="mb-4">
              <div className="space-y-4">
                <div
                  className="p-4 rounded-lg shadow-md"
                  style={{
                    background: "var(--section-purple)",
                    color: "var(--section-purple-text, #ddd6fe)",
                  }}
                >
                  <h3 className="font-semibold mb-3 flex items-center" style={{ color: "var(--section-purple-text, #ddd6fe)", fontSize: "1.1rem" }}>
                    <MapPin className="mr-2 h-5 w-5" style={{ color: "var(--section-purple-text, #ddd6fe)" }} />
                    Inventory Details
                  </h3>
                  <div className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-purple-label, #ddd6fe)" }}>
                          Bin Locations <span className="text-red-500">*</span>
                        </label>
                        <div className="flex flex-col space-y-2 mb-2">
                          {editedProduct.binLocations && editedProduct.binLocations.map((location, index) => (
                            <div key={index} className="flex items-center space-x-2">
                              <input
                                type="text"
                                placeholder="Bin Location"
                                value={location.bin}
                                onChange={(e) => {
                                  const updatedLocations = [...editedProduct.binLocations];
                                  updatedLocations[index].bin = e.target.value;
                                  setEditedProduct({ ...editedProduct, binLocations: updatedLocations });
                                }}
                                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ background: "transparent", color: "#fff" }}
                              />
                              <input
                                type="number"
                                placeholder="Quantity"
                                value={location.quantity}
                                onChange={(e) => {
                                  const updatedLocations = [...editedProduct.binLocations];
                                  updatedLocations[index].quantity = e.target.value;
                                  setEditedProduct({ ...editedProduct, binLocations: updatedLocations });
                                }}
                                className="w-24 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                                style={{ background: "transparent", color: "#fff" }}
                              />
                              <button
                                type="button"
                                onClick={() => {
                                  const updatedLocations = editedProduct.binLocations.filter((_, i) => i !== index);
                                  setEditedProduct({ ...editedProduct, binLocations: updatedLocations });
                                }}
                                className="p-2 text-red-600 hover:text-red-800"
                              >
                                <Trash className="h-4 w-4" />
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            const binLocations = editedProduct.binLocations || [];
                            setEditedProduct({
                              ...editedProduct,
                              binLocations: [...binLocations, { bin: "", quantity: 0 }]
                            });
                          }}
                          className="inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          + Add Bin Location
                        </button>
                      </div>
                      <div className="md-2">
                        <div className="flex-1">
                          <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-purple-label, #ddd6fe)" }}>
                            Quantity <span className="text-red-500">*</span>
                          </label>
                          <input
                            type="text"
                            readOnly
                            value={editedProduct.binLocations?.reduce((sum, l) => sum + (parseInt(l.quantity) || 0), 0) || "0"}
                            className="w-full px-3 py-2 border-2 border-gray-300 rounded-md focus:outline-none font-bold"
                            placeholder="Calculated from bins"
                            tabIndex="-1"
                            style={{
                              color: "var(--avl-qty-text, #bbf7d0)",
                              fontWeight: "bold",
                              fontSize: "1.1rem",
                              letterSpacing: "0.05em",
                              background: "transparent"
                            }}
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-purple-label, #ddd6fe)" }}>
                          Reorder Point <span className="text-red-500">*</span>
                        </label>
                        <input
                          type="number"
                          name="reorderPoint"
                          required={true}
                          value={editedProduct.reorderPoint}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="5"
                          min="0"
                          style={{ background: "transparent", color: "#fff" }}
                        />
                      </div>
                      <div>
                        <label className="block text-sm font-medium mb-1" style={{ color: "var(--section-purple-label, #ddd6fe)" }}>
                          Reorder Quantity
                        </label>
                        <input
                          type="number"
                          name="reorderQty"
                          value={editedProduct.reorderQty}
                          onChange={handleInputChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="10"
                          min="0"
                          style={{ background: "transparent", color: "#fff" }}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* Files & Documentation Section */}
            <div
              className="mb-4 p-4 rounded-lg shadow-md"
              style={{
                background: "var(--section-gray)",
                color: "var(--foreground)",
              }}
            >
              <h3 className="text-xl font-semibold mb-3" style={{ color: "#fff" }}>Files & Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#fff" }}>
                    Component Image
                  </label>
                  <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md" style={{ borderColor: "#52525b" }}>
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto h-32 w-auto object-contain mb-2"
                          />
                          <p className="text-xs" style={{ color: "#fff", opacity: 0.7 }}>{editedProduct.image}</p>
                        </div>
                      ) : (
                        <div>
                          <svg
                            className="mx-auto h-12 w-12 text-gray-400"
                            stroke="currentColor"
                            fill="none"
                            viewBox="0 0 48 48"
                            aria-hidden="true"
                          >
                            <path
                              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                              strokeWidth={2}
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                          <p className="text-xs" style={{ color: "#a3a3a3" }}>PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="image-upload"
                          className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md"
                          style={{
                            color: "var(--accent)",
                            background: "var(--accent-foreground)"
                          }}
                        >
                          <span>{imagePreview ? "Change Image" : "Upload Image"}</span>
                          <input
                            id="image-upload"
                            name="image"
                            type="file"
                            accept="image/*"
                            onChange={handleImageUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
                {/* Datasheet Upload */}
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: "#fff" }}>
                    Datasheet
                  </label>
                  <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-dashed rounded-md" style={{ borderColor: "#52525b" }}>
                    <div className="space-y-1 text-center">
                      {datasheetName ? (
                        <div>
                          <Clipboard className="mx-auto h-12 w-12" style={{ color: "var(--accent)" }} />
                          <p className="text-xs font-medium" style={{ color: "#fff" }}>
                            {datasheetName}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Folder className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-xs" style={{ color: "#a3a3a3" }}>PDF, DOC, XLS up to 10MB</p>
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="datasheet-upload"
                          className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md"
                          style={{
                            color: "var(--accent)",
                            background: "var(--accent-foreground)"
                          }}
                        >
                          <span>{datasheetName ? "Change File" : "Upload Datasheet"}</span>
                          <input
                            id="datasheet-upload"
                            name="datasheet"
                            type="file"
                            onChange={handleDatasheetUpload}
                            className="sr-only"
                          />
                        </label>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* View Mode */
          <div className="mx-auto">
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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${calculateTotalQuantity(product.binLocations) > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {calculateTotalQuantity(product.binLocations) > 0 ? 'In Stock' : 'Out of Stock'}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Left Column - Image and Quick Stats */}
              <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-gray)" }}>
                {/* Product Image */}
                <div className="relative h-48 flex items-center justify-center border-b" style={{ background: "var(--section-indigo)" }}>
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
                    <span className="text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Total Quantity</span>
                    <span className="font-semibold text-lg" style={{ color: "var(--avl-qty-text)" }}>
                      {calculateTotalQuantity(product.binLocations)}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-4">
                    <span className="text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Category</span>
                    {product.category ? (
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                        style={{ background: "var(--section-indigo)", color: "var(--section-indigo-text)" }}>
                        {product.category}
                      </span>
                    ) : (
                      <span className="text-gray-400">Not specified</span>
                    )}
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Manufacturer</span>
                    <span className="font-medium" style={{ color: "var(--section-indigo-text)" }}>{product.manufacturer || "Not specified"}</span>
                  </div>
                </div>
                {/* Datasheet Preview */}
                <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-gray)" }}>
                  <div className="px-4 py-5 border-b" style={{ background: "var(--section-indigo)" }}>
                    <h2 className="text-lg font-medium flex items-center" style={{ color: "var(--section-indigo-text)" }}>
                      <FileText className="h-5 w-5 mr-2" /> Datasheet
                    </h2>
                  </div>
                  <div className="p-4">
                    {product.datasheet ? (
                      <div className="space-y-4">
                        <div className="border rounded-lg overflow-hidden">
                          <div className="h-48 flex items-center justify-center" style={{ background: "var(--section-gray)" }}>
                            <FileText
                              className="h-16 w-16 text-gray-400"
                              onClick={() => openPdfModal(product.datasheet)}
                            />
                          </div>
                          <div className="p-3 border-t">
                            <div className="flex items-center justify-between">
                              <span className="text-sm truncate" style={{ color: "var(--section-indigo-text)" }}>
                                {product.datasheet ? product.datasheet.split('/').pop() : "Datasheet"}
                              </span>
                              <div className="flex space-x-2">
                                <a
                                  href={product.datasheet}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center px-3 py-1 border border-transparent text-xs font-medium rounded shadow-sm text-white"
                                  style={{ background: "var(--accent)" }}
                                >
                                  <Download className="mr-1 h-3 w-3" /> Download
                                </a>
                                <button
                                  onClick={() => window.open(`https://mozilla.github.io/pdf.js/web/viewer.html?file=${encodeURIComponent(product.datasheet)}`, '_blank')}
                                  className="inline-flex items-center px-3 py-1 border border-gray-300 text-xs font-medium rounded shadow-sm"
                                  style={{ color: "var(--accent)", background: "var(--accent-foreground)" }}
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
                <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-indigo)" }}>
                  <div className="px-4 py-5 border-b" style={{ background: "var(--section-indigo)" }}>
                    <h2 className="text-lg font-medium flex items-center" style={{ color: "var(--section-indigo-text)" }}>
                      <ClipboardList className="h-5 w-5 mr-2" /> Basic Information
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Part Name</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-indigo-text)" }}>{product.partName || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Manufacturer Part</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-indigo-text)" }}>{product.manufacturerPart || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Manufacturer</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-indigo-text)" }}>{product.manufacturer || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-indigo-label)" }}>Description</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-indigo-text)" }}>{product.description || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-purple)" }}>
                  <div className="px-4 py-5 border-b" style={{ background: "var(--section-purple)" }}>
                    <h2 className="text-lg font-medium flex items-center" style={{ color: "var(--section-purple-text)" }}>
                      <Package className="h-5 w-5 mr-2" /> Inventory Details
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-purple-label)" }}>Bin Locations</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-purple-text)" }}>
                            {product && product.binLocations && product.binLocations.length > 0 ? (
                              <div className="space-y-1">
                                {product.binLocations.map((location, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium"
                                      style={{ background: "var(--section-indigo)", color: "var(--section-indigo-text)" }}>
                                      {location.bin}
                                    </span>
                                    <span className="text-xs" style={{ color: "var(--section-purple-label)" }}>Qty: {location.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "Not specified"
                            )}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-purple-label)" }}>Reorder Point</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-purple-text)" }}>{product.reorderPoint || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-purple-label)" }}>Reorder Quantity</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-purple-text)" }}>{product.reorderQty || "Not specified"}</td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>

              {/* Right Column - Pricing & References */}
              <div className="space-y-6">
                <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-green)" }}>
                  <div className="px-4 py-5 border-b" style={{ background: "var(--section-green)" }}>
                    <h2 className="text-lg font-medium flex items-center" style={{ color: "var(--section-green-text)" }}>
                      <DollarSign className="h-5 w-5 mr-2" /> Pricing
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-green-label)" }}>Cost Price</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-green-text)" }}>
                            {product.costPrice ? `$${product.costPrice}` : "Not specified"}
                          </td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-green-label)" }}>Sale Price</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-green-text)" }}>
                            {product.salePrice ? `$${product.salePrice}` : "Not specified"}
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>

                <div className="rounded-lg shadow overflow-hidden" style={{ background: "var(--section-pink)" }}>
                  <div className="px-4 py-5 border-b" style={{ background: "var(--section-pink)" }}>
                    <h2 className="text-lg font-medium flex items-center" style={{ color: "var(--section-pink-text)" }}>
                      <Eye className="h-5 w-5 mr-2" /> References
                    </h2>
                  </div>
                  <div className="p-4">
                    <table className="min-w-full">
                      <tbody className="divide-y divide-gray-200">
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-pink-label)" }}>Vendor</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-pink-text)" }}>{product.vendor || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-pink-label)" }}>Vendor Part #</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-pink-text)" }}>{product.vendorPart || "Not specified"}</td>
                        </tr>
                        <tr>
                          <td className="py-2 text-sm font-medium" style={{ color: "var(--section-pink-label)" }}>Customer Reference</td>
                          <td className="py-2 text-sm" style={{ color: "var(--section-pink-text)" }}>{product.customerRef || "Not specified"}</td>
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
        <div
          className="px-6 py-4 border-t rounded-lg border-gray-200 mt-6"
          style={{
            background: "var(--section-yellow, #fef9c3)",
            color: "var(--section-yellow-text, #b45309)",
            boxShadow: "0 2px 8px 0 rgba(251, 191, 36, 0.08)"
          }}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center">
              <TimeStamp />
            </div>
            <div>
              {Number(product.quantity) <= Number(product.reorderPoint) && Number(product.reorderPoint) > 0 && (
                <div
                  className="flex items-center px-3 py-1 rounded-full text-sm font-semibold"
                  style={{
                    background: "var(--section-yellow, #fde68a)",
                    color: "var(--section-yellow-text, #b45309)",
                    border: "1px solid #fde68a"
                  }}
                >
                  <AlertCircle className="h-4 w-4 mr-1" />
                  <span>Low stock alert</span>
                </div>
              )}
            </div>
          </div>
        </div>
        {/* PDF Modal */}
        <PdfViewerModal
          isOpen={isPdfModalOpen}
          pdfUrl={pdfUrl}
          onClose={closePdfModal}
        />


      </div>


    </div >
  );
};