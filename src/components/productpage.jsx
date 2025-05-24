"use client";
import { useState, useEffect } from "react";
import { use } from "react"; // Import React.use
import Link from "next/link";
import { ArrowLeft, Save, Package, Clipboard, X, FileText, Download, Eye, ShoppingCart, FileX, RefreshCw, Tag, Edit, Folder, Trash, DollarSign, AlertCircle, ClipboardList, Home } from "lucide-react";
import githubConfig from '../config/githubConfig';
import Header from "@/components/Header";
import TimeStamp from '@/components/TimeStamp';
export default function ProductDetail({ params }) {



  // Properly unwrap params using React.use()
  const unwrappedParams = use(params);
  const partName = unwrappedParams?.partName ? decodeURIComponent(unwrappedParams.partName) : null;

  const searchParams = new URLSearchParams(window.location.search);
  const shouldEditMode = searchParams.get('editMode') === 'true';

  const [product, setProduct] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [editMode, setEditMode] = useState(shouldEditMode); // Initialize with the query param value
  const [editedProduct, setEditedProduct] = useState({
    ...product,
    binLocations: product && product.binLocations ? product.binLocations : []
  });
  const [binLocations, setBinLocations] = useState(
    product && product.binLocations ? product.binLocations : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState(null);
  // New state to preview uploads
  const [imagePreview, setImagePreview] = useState(null);
  const [datasheetName, setDatasheetName] = useState(null);
  const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
  const [pdfUrl, setPdfUrl] = useState("");
  const calculateTotalQuantity = (binLocations) => {
    if (!binLocations || !Array.isArray(binLocations)) return 0;
    return binLocations.reduce((total, location) => {
      return total + (parseInt(location.quantity) || 0);
    }, 0);
  };
  const [formData, setFormData] = useState({
    id: "",
    createdAt: "",
    partName: "",
    manufacturer: "",
    manufacturerPart: "",
    vendor: "",
    vendorProductLink: "",
    image: "",
    imageData: "",
    imageType: "",
    datasheet: "",
    datasheetData: "",
    datasheetType: "",
    avl_quantity: calculateTotalQuantity(binLocations), // This will now be calculated
    binLocations: [],
    customerRef: "",
    description: "",
    reorderPoint: "",
    reorderQty: "",
    costPrice: "",
    salePrice: "",
    category: ""
  });
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const shouldEditMode = searchParams.get('editMode') === 'true';
    setEditMode(shouldEditMode);
  }, []);
  useEffect(() => {
    if (editedProduct) {
      const totalQty = calculateTotalQuantity(editedProduct.binLocations);
      setEditedProduct(prev => ({
        ...prev,
        quantity: totalQty
      }));
    }
  }, [editedProduct?.binLocations]);

  // Initialize editedProduct when product is loaded
  useEffect(() => {
    if (product) {
      setEditedProduct({
        ...product,
        binLocations: product.binLocations || []
      });
      setImagePreview(product.image);
      setDatasheetName(product.datasheet ? product.datasheet.split("/").pop() : null);
      setBinLocations(product.binLocations || []);
    }
  }, [product]);


  useEffect(() => {
    fetchDropdownOptionsFromGithub();
  }, []);

  const safeBase64Encode = (str) => {
    try {
      // Convert the string to UTF-8 bytes
      const utf8Bytes = new TextEncoder().encode(str);
      // Convert bytes to binary string
      const binaryStr = String.fromCharCode.apply(null, utf8Bytes);
      // Base64 encode the binary string
      return btoa(binaryStr);
    } catch (error) {
      console.error('Encoding error:', error);
      // Fallback method
      return btoa(unescape(encodeURIComponent(str)));
    }
  };

  const safeBase64Decode = (str) => {
    try {
      // Decode base64 to binary string
      const binaryStr = atob(str);
      // Convert binary string to UTF-8 bytes
      const utf8Bytes = new Uint8Array(binaryStr.length);
      for (let i = 0; i < binaryStr.length; i++) {
        utf8Bytes[i] = binaryStr.charCodeAt(i);
      }
      // Convert UTF-8 bytes to string
      return new TextDecoder().decode(utf8Bytes);
    } catch (error) {
      console.error('Decoding error:', error);
      // Fallback method
      return decodeURIComponent(escape(atob(str)));
    }
  };

  // State for dropdown options - Added manufacturerParts
  const [dropdownOptions, setDropdownOptions] = useState({
    partNames: [],
    manufacturers: [],
    vendors: [],
    manufacturerParts: [], // Added this array for manufacturer part numbers
    categories: [
      "IC", "Resistor", "Capacitor", "Transistor", "Diode", "LED", "Connector",
      "Switch", "Sensor", "Microcontroller", "PCB", "Battery", "Module", "Tool", "Other"
    ]
  });

  const fetchDropdownOptionsFromGithub = async () => {
    try {
      const { token, repo, owner, branch, path } = githubConfig;

      // Check if token and other required fields are available
      if (!token || !repo || !owner) {
        // Fall back to localStorage if GitHub config is not complete
        alert('invalid token or repo or owner');

        // loadFromLocalStorage();
        return;
      }

      // Path to the dropdown options JSON file
      const optionsFilePath = `${path}/dropdownOptions.json`;

      // GitHub API URL for contents
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;

      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (response.status === 404) {
        // File doesn't exist yet, use default options
        alert('Error: 404');

        // loadFromLocalStorage();
        return;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Decode content from base64
      const content = safeBase64Decode(data.content);
      const options = JSON.parse(content);

      // Ensure manufacturerParts exists in the options
      if (!options.manufacturerParts) {
        options.manufacturerParts = [];
      }

      // Update state with fetched options
      setDropdownOptions(options);

    } catch (error) {
      console.error("Error fetching dropdown options:", error);
      // Fall back to localStorage
      // loadFromLocalStorage();
    }
  };

  const openPdfModal = (url) => {
    setPdfUrl(url);
    setIsPdfModalOpen(true);
  };

  // Close PDF modal
  const closePdfModal = () => {
    setIsPdfModalOpen(false);
    setPdfUrl("");
  };

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

        alert('Error: GitHub config is incomplete. Unable to fetch product details.');

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
    if (name === 'quantity') return;

    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Updated image upload handler for edit mode
  const handleImageUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update preview
    const objectUrl = URL.createObjectURL(file);
    setImagePreview(objectUrl);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      // Get base64 data without the prefix (e.g., "data:image/jpeg;base64,")
      const base64String = event.target.result;
      const base64Data = base64String.split(',')[1];

      // Update the editedProduct with image information
      setEditedProduct(prev => ({
        ...prev,
        image: file.name,
        imageData: base64Data,
        imageType: file.type,
        // Flag to indicate this is a new image that needs to be uploaded
        imageModified: true
      }));
    };
    reader.readAsDataURL(file);
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

  // Updated datasheet upload handler for edit mode
  const handleDatasheetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Update preview name
    setDatasheetName(file.name);

    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      // Get base64 data without the prefix
      const base64String = event.target.result;
      const base64Data = base64String.split(',')[1];

      // Update the editedProduct with datasheet information
      setEditedProduct(prev => ({
        ...prev,
        datasheet: file.name,
        datasheetData: base64Data,
        datasheetType: file.type,
        // Flag to indicate this is a new datasheet that needs to be uploaded
        datasheetModified: true
      }));
    };
    reader.readAsDataURL(file);
  };

  // Function to create a Git tree with multiple file updates
  const createGitTreeWithFiles = async (fileChanges) => {
    const { token, repo, owner, branch } = githubConfig;

    // First, get the reference to the latest commit on the branch
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!refResponse.ok) {
      throw new Error(`Failed to get branch reference: ${refResponse.statusText}`);
    }

    const refData = await refResponse.json();
    const latestCommitSha = refData.object.sha;

    // Get the commit object to retrieve the tree
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${latestCommitSha}`, {
      headers: {
        "Authorization": `Bearer ${token}`
      }
    });

    if (!commitResponse.ok) {
      throw new Error(`Failed to get commit: ${commitResponse.statusText}`);
    }

    const commitData = await commitResponse.json();
    const baseTreeSha = commitData.tree.sha;

    // Create the new tree with all file changes
    const treeItems = await Promise.all(fileChanges.map(async (file) => {
      // Create the blob
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: file.isBase64 ? file.content : btoa(unescape(encodeURIComponent(file.content))),
          encoding: "base64"
        })
      });


      if (!blobResponse.ok) {
        throw new Error(`Failed to create blob: ${blobResponse.statusText}`);
      }

      const blobData = await blobResponse.json();

      // Return the tree item with the blob SHA
      return {
        path: file.path,
        mode: "100644",
        type: "blob",
        sha: blobData.sha  // Reference the blob by SHA instead of including content directly
      };
    }));

    // Create the new tree with the blob references
    const newTreeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base_tree: baseTreeSha,
        tree: treeItems
      })
    });

    if (!newTreeResponse.ok) {
      throw new Error(`Failed to create tree: ${newTreeResponse.statusText}`);
    }

    const newTreeData = await newTreeResponse.json();

    // Create a new commit with the new tree
    const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: 'POST',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: "Update product information and assets",
        tree: newTreeData.sha,
        parents: [latestCommitSha]
      })
    });

    if (!newCommitResponse.ok) {
      throw new Error(`Failed to create commit: ${newCommitResponse.statusText}`);
    }

    const newCommitData = await newCommitResponse.json();

    // Update the reference to point to the new commit
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: 'PATCH',
      headers: {
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false
      })
    });

    if (!updateRefResponse.ok) {
      throw new Error(`Failed to update reference: ${updateRefResponse.statusText}`);
    }

    return newCommitData;
  };

  // Updated saveChanges function to use a single commit
  const saveChanges = async () => {
    setIsSaving(true);
    setSaveError(null);

    try {
      const { token, repo, owner, path, branch = 'main' } = githubConfig;

      // Create a copy of the edited product to modify
      const productToSave = {
        ...editedProduct,
        id: product.id, // Ensure original ID is preserved
        lastModified: new Date().toISOString() // Add last modified timestamp
      };
      // Prepare an array to hold all file changes
      const fileChanges = [];

      // Prepare image change if it was modified
      if (productToSave.imageModified && productToSave.imageData) {
        // Create sanitized identifiers for filenames
        const sanitizedManufacturerPart = productToSave.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
        const sanitizedPartName = productToSave.partName.replace(/[^a-z0-9():\s]/gi, "_").replace(/\s+/g, "_");
        const itemIdentifier = `${productToSave.id}-${sanitizedPartName}-${sanitizedManufacturerPart}`;

        // Set the image path
        const imageFilePath = `${path}/images/${itemIdentifier}_${productToSave.image}`;
        fileChanges.push({
          path: imageFilePath,
          content: productToSave.imageData,
          isBase64: true
        });

        // Update the image URL in the product data
        productToSave.image = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imageFilePath}`;

        // Remove the base64 data and flag to avoid storing it in JSON
        delete productToSave.imageData;
        delete productToSave.imageModified;
      }

      // Prepare datasheet change if it was modified
      if (productToSave.datasheetModified && productToSave.datasheetData) {
        // Create sanitized identifiers for filenames
        const sanitizedManufacturerPart = productToSave.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
        const sanitizedPartName = productToSave.partName.replace(/[^a-z0-9():\s]/gi, "_").replace(/\s+/g, "_");
        const itemIdentifier = `${productToSave.id}-${sanitizedPartName}-${sanitizedManufacturerPart}`;

        // Set the datasheet path
        const datasheetFilePath = `${path}/datasheets/${itemIdentifier}_${productToSave.datasheet}`;

        // Add datasheet file to changes array
        fileChanges.push({
          path: datasheetFilePath,
          content: productToSave.datasheetData, // Convert base64 to raw content
          isBase64: true

        });

        // Update the datasheet URL in the product data
        productToSave.datasheet = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${datasheetFilePath}`;

        // Remove the base64 data and flag to avoid storing it in JSON
        delete productToSave.datasheetData;
        delete productToSave.datasheetModified;
      }



      // First update local state
      setProduct(productToSave);



      // Now prepare the JSON file and add it to our changes
      if (token && repo && owner) {
        const jsonDirPath = `${path}/jsons`;

        // Create sanitized filename - FIXED: Use productToSave instead of product
        const sanitizedManufacturerPart = productToSave.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
        const sanitizedPartName = productToSave.partName.replace(/[^a-z0-9():\s]/gi, "_").replace(/\s+/g, "_");
        const jsonFileName = `${productToSave.id}-${sanitizedPartName}-${sanitizedManufacturerPart}.json`;
        const jsonFilePath = `${path}/jsons/${jsonFileName}`;

        fileChanges.push({
          path: jsonFilePath,
          content: JSON.stringify(productToSave, null, 2),
          isBase64: false
        });

        // Only proceed with the commit if we have changes to make
        if (fileChanges.length > 0) {
          // Create a single commit with all changes
          await createGitTreeWithFiles(fileChanges);
          console.log("Successfully saved all changes to GitHub in a single commit");
        }
      }

      setProduct(editedProduct);
      setEditMode(false);
      setIsSaving(false);
    } catch (error) {
      setSaveError(error.message || "Failed to save changes");
      setIsSaving(false);
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
                      {dropdownOptions.categories.map((category, index) => (
                        <option key={index} value={category}>
                          {category}
                        </option>
                      ))}
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bin Locations</label>
                  <div className="space-y-2 mb-2">
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
            <div className="mb-4 bg-gray-50 p-4 rounded-lg">
              <h3 className="text-xl font-medium text-gray-800 mb-3">Files & Documentation</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Image Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Component Image
                  </label>
                  <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {imagePreview ? (
                        <div>
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="mx-auto h-32 w-auto object-contain mb-2"
                          />
                          <p className="text-xs text-gray-500">{editedProduct.image}</p>
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
                          <p className="text-xs text-gray-500">PNG, JPG, GIF up to 10MB</p>
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="image-upload"
                          className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Datasheet
                  </label>
                  <div className="mt-1 flex items-center justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-md">
                    <div className="space-y-1 text-center">
                      {datasheetName ? (
                        <div>
                          <Clipboard className="mx-auto h-12 w-12 text-blue-500" />
                          <p className="text-xs font-medium text-gray-900 mt-2">
                            {datasheetName}
                          </p>
                        </div>
                      ) : (
                        <div>
                          <Folder className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="text-xs text-gray-500">PDF, DOC, XLS up to 10MB</p>
                        </div>
                      )}
                      <div>
                        <label
                          htmlFor="datasheet-upload"
                          className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                        >
                          <span>{datasheetName ? "Change File" : "Upload Datasheet"}</span>
                          <input
                            id="datasheet-upload"
                            name="datasheet"
                            type="file"
                            onChange={handleDatasheetUpload}
                            className="sr-only"
                          // value={editedProduct.datasheet}

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
                <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${calculateTotalQuantity(product.binLocations) > 0
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
                  }`}>
                  {calculateTotalQuantity(product.binLocations) > 0 ? 'In Stock' : 'Out of Stock'}
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
                    <span className="text-sm font-medium text-gray-500">Total Quantity</span>
                    <span className="font-semibold text-lg">
                      {calculateTotalQuantity(product.binLocations)}
                    </span>
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
                            <FileText
                              className="h-16 w-16 text-gray-400"
                              onClick={() => openPdfModal(product.datasheet)}
                            />
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
                          <td className="py-2 text-sm font-medium text-gray-600">Bin Locations</td>
                          <td className="py-2 text-sm text-gray-800">
                            {product && product.binLocations && product.binLocations.length > 0 ? (
                              <div className="space-y-1">
                                {product.binLocations.map((location, index) => (
                                  <div key={index} className="flex items-center space-x-2">
                                    <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                      {location.bin}
                                    </span>
                                    <span className="text-xs text-gray-600">Qty: {location.quantity}</span>
                                  </div>
                                ))}
                              </div>
                            ) : (
                              "Not specified"
                            )}
                          </td>
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
              <TimeStamp />
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