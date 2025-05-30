"use client";
import { useState, useEffect } from 'react';
import { FileText, Download, Search, Trash, PlusCircle, AlertCircle, X } from 'lucide-react';
import githubConfigImport from '@/config/githubConfig';
import Header from "@/components/Header";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";
import { batchCommitToGithub, safeBase64Encode, saveLastUsedIdToGithub } from "@/utils/githubApi";

export default function Datasheets() {
    const [datasheets, setDatasheets] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [selectedPdf, setSelectedPdf] = useState('');
    const [isImageModalOpen, setIsImageModalOpen] = useState(false);
    const [selectedImage, setSelectedImage] = useState('');
    const [imageUrls, setImageUrls] = useState({});
    const [quantityData, setQuantityData] = useState({});
    const [githubConfig, setGithubConfig] = useState(githubConfigImport);
    const [configLoaded, setConfigLoaded] = useState(false);
    const [showDeleteModal, setShowDeleteModal] = useState(false);
    const [showSuccessModal, setShowSuccessModal] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [showErrorModal, setShowErrorModal] = useState(false);
    const [errorMessage, setErrorMessage] = useState('');
    const [datasheetToDelete, setDatasheetToDelete] = useState(null);

    const [showAddProductModal, setShowAddProductModal] = useState(false);
    const [addProductForm, setAddProductForm] = useState({
        id: "",  // Add this line
        createdAt: "",
        partName: "",
        manufacturer: "",
        manufacturerPart: "",
        vendor: "",
        vendorProductLink: "", // Changed from vendorPart
        image: "",
        imageData: "",
        imageType: "",
        datasheet: "",
        datasheetData: "",
        datasheetType: "",
        avl_quantity: "",
        binLocations: [],
        customerRef: "",
        description: "",
        reorderPoint: "",
        reorderQty: "",
        costPrice: "",
        salePrice: "",
        category: ""
    });


    

    const [addProductImagePreview, setAddProductImagePreview] = useState(null);
    const [addProductDatasheetName, setAddProductDatasheetName] = useState(null);
    const [isSavingProduct, setIsSavingProduct] = useState(false);

    // Fetch user config (like manage-inventory)
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
            if (!currentUser) {
                setConfigLoaded(true);
                return;
            }
            const fetchUserConfig = async () => {
                const docId = currentUser.email.replace(/\./g, "_");
                const userDoc = await getDoc(doc(db, "users", docId));
                let config = githubConfigImport;
                if (userDoc.exists()) {
                    const data = userDoc.data();
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
                    }
                }
                setGithubConfig(config);
                setConfigLoaded(true);
            };
            fetchUserConfig();
        });
        return () => unsubscribe();
    }, []);

    // Fetch datasheets with POST and config
    useEffect(() => {
        if (!configLoaded) return;
        const fetchDatasheets = async () => {
            setLoading(true);
            try {
                const response = await fetch(`/api/datasheets`, {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ githubConfig }),
                });
                const data = await response.json();
                if (Array.isArray(data)) {
                    setDatasheets(data);
                } else if (data.error) {
                    setError(data.error);
                } else {
                    setError('Invalid data format received');
                }
            } catch (error) {
                setError('Failed to fetch datasheets');
            } finally {
                setLoading(false);
            }
        };
        fetchDatasheets();
    }, [configLoaded, githubConfig]);

    const fetchDatasheetDetails = async (datasheet) => {
        // Check if we already have the data cached
        if (quantityData[datasheet.id]) {
            return quantityData[datasheet.id];
        }

        // First try to get from JSON content
        if (datasheet.jsonContent) {
            const qty = datasheet.jsonContent.avl_quantity || 0;
            setQuantityData(prev => ({
                ...prev,
                [datasheet.id]: qty
            }));
            return qty;
        }

        // If no jsonContent, try to fetch from jsonFile
        if (datasheet.jsonFile) {
            try {
                const response = await fetch(datasheet.jsonFile);
                const jsonData = await response.json();
                const qty = jsonData.avl_quantity || 0;
                setQuantityData(prev => ({
                    ...prev,
                    [datasheet.id]: qty
                }));
                return qty;
            } catch (error) {
                console.error('Error fetching JSON:', error);
                return 0;
            }
        }

        return 0;
    };


    const [imageLoadErrors, setImageLoadErrors] = useState({});

    const handleImageError = (datasheetId) => {
        setImageLoadErrors(prev => ({
            ...prev,
            [datasheetId]: true
        }));
    };
    const filteredDatasheets = Array.isArray(datasheets)
        ? datasheets.filter(datasheet =>
            datasheet.name.toLowerCase().includes(searchQuery.toLowerCase())
        )
        : [];


    const openPdfModal = (pdfUrl) => {
        setSelectedPdf(pdfUrl);
        setIsPdfModalOpen(true);
    };

    const openImageModal = (imageUrl) => {
        setSelectedImage(imageUrl);
        setIsImageModalOpen(true);
    };

    // PDF Modal Component
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
    const getPlaceholderFromGitHub = () => {
        const { owner, repo } = githubConfig;
        const placeholderUrl = `https://raw.githubusercontent.com/${owner}/${repo}/master/database/placeholder.svg`;
        const simplePlaceholder = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 24 24' fill='none' stroke='%23888' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'%3E%3Crect x='3' y='3' width='18' height='18' rx='2' ry='2'%3E%3C/rect%3E%3Ccircle cx='8.5' cy='8.5' r='1.5'%3E%3C/circle%3E%3Cpolyline points='21 15 16 10 5 21'%3E%3C/polyline%3E%3C/svg%3E";
        return simplePlaceholder || placeholderUrl;
    };
    const getImageUrl = async (datasheet) => {
        // Check if we already have the image URL cached
        if (imageUrls[datasheet.id]) {
            return imageUrls[datasheet.id];
        }

        // First try to get the image URL from the JSON content
        if (datasheet.jsonContent?.image) {
            setImageUrls(prev => ({
                ...prev,
                [datasheet.id]: datasheet.jsonContent.image
            }));
            return datasheet.jsonContent.image;
        }

        // If no jsonContent, try to fetch from jsonFile
        if (datasheet.jsonFile) {
            try {
                const response = await fetch(datasheet.jsonFile);
                const jsonData = await response.json();
                if (jsonData.image) {
                    setImageUrls(prev => ({
                        ...prev,
                        [datasheet.id]: jsonData.image
                    }));
                    return jsonData.image;
                }
            } catch (error) {
                console.error('Error fetching JSON:', error);
            }
        }

        // Fallback to placeholder if no image URL found
        return getPlaceholderFromGitHub();
    };



    // Image preview Component
    const ImagePreview = ({ url, alt, handleClick }) => {
        const [imageError, setImageError] = useState(false);
        const [loadedUrl, setLoadedUrl] = useState(null);
        const placeholderUrl = getPlaceholderFromGitHub();
        const ultimateFallback = "data:image/svg+xml,..."; // Your existing fallback SVG

        useEffect(() => {
            const loadImage = async () => {
                try {
                    const imageUrl = await url;
                    setLoadedUrl(imageUrl);
                } catch (error) {
                    console.error('Error loading image:', error);
                    setImageError(true);
                }
            };

            loadImage();
        }, [url]);

        const imgSrc = imageError || !loadedUrl ? placeholderUrl || ultimateFallback : loadedUrl;

        return (
            <div
                className="h-12 w-12 bg-gray-100 rounded border border-gray-200 overflow-hidden flex items-center justify-center cursor-pointer hover:border-blue-500 transition-colors"
                onClick={handleClick}
                title="Click to view larger image"
            >
                <img
                    src={imgSrc}
                    alt={alt || "Product Image"}
                    className="object-contain h-10 w-10 "
                    onError={(e) => {
                        console.log(`Image error for: ${imgSrc}`);
                        setImageError(true);
                        e.target.src = ultimateFallback;
                    }}
                />
            </div>
        );
    };

    // ImageModal component
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
    useEffect(() => {
        const fetchAllQuantities = async () => {
            const quantities = {};
            for (const datasheet of datasheets) {
                const qty = await fetchDatasheetDetails(datasheet);
                quantities[datasheet.id] = qty;
            }
            setQuantityData(quantities);
        };

        if (datasheets.length > 0) {
            fetchAllQuantities();
        }
    }, [datasheets]);

    async function saveMinimalProduct() {
        const { token, repo, owner, branch, path } = githubConfig;
        // Fetch last used ID
        let lastUsedId = parseInt(localStorage.getItem('lastUsedId') || "1000");
        const currentId = lastUsedId + 1;
        const sanitizedManufacturerPart = addProductForm.manufacturerPart.replace(/[^a-z0-9():]/gi, "_");
        const sanitizedPartName = addProductForm.partName.replace(/[^a-z0-9():]/gi, "_").replace(/\s+/g, "_");
        const itemIdentifier = `${currentId}-${sanitizedPartName}-${sanitizedManufacturerPart}`;

        // Prepare data object
        const dataToSave = {
            id: currentId.toString(),
            partName: addProductForm.partName,
            manufacturerPart: addProductForm.manufacturerPart,
            image: "",
            datasheet: "",
            createdAt: new Date().toISOString()
        };

        const fileUpdates = [];

        // Image
        if (addProductForm.image && addProductForm.imageData) {
            const imageFilePath = `${path}/images/${itemIdentifier}-${addProductForm.image}`;
            dataToSave.image = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imageFilePath}`;
            fileUpdates.push({
                path: imageFilePath,
                content: addProductForm.imageData
            });
        }

        // Datasheet
        if (addProductForm.datasheet && addProductForm.datasheetData) {
            const datasheetFilePath = `${path}/datasheets/${itemIdentifier}-${addProductForm.datasheet}`;
            dataToSave.datasheet = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${datasheetFilePath}`;
            fileUpdates.push({
                path: datasheetFilePath,
                content: addProductForm.datasheetData
            });
        }

        // JSON
        const jsonFilePath = `${path}/jsons/${itemIdentifier}.json`;
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const jsonContent = safeBase64Encode(jsonString);
        fileUpdates.push({
            path: jsonFilePath,
            content: jsonContent
        });

        // Update lastUsedId
        const idTrackerPath = `${path}/lastUsedId.json`;
        const idString = JSON.stringify({ lastUsedId: currentId }, null, 2);
        const idContent = safeBase64Encode(idString);
        fileUpdates.push({
            path: idTrackerPath,
            content: idContent
        });

        // Commit all
        await batchCommitToGithub({
            token,
            repo,
            owner,
            branch,
            fileUpdates,
            commitMessage: `Added (ID: ${dataToSave.id})-${dataToSave.partName} via datasheet modal.`
        });

        localStorage.setItem('lastUsedId', currentId.toString());
        setShowAddProductModal(false);
        // Optionally: show a success modal or refresh the list
        window.location.reload();
    }
    async function uploadDatasheet(file) {
        if (!file) return;
        setLoading(true);
        try {
            const reader = new FileReader();
            reader.onload = async (event) => {
                const base64 = event.target.result.split(',')[1];
                const filePath = `${githubConfig.datasheets}/${file.name}`;
                const res = await fetch('/api/github-uploaddatasheet', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        githubConfig,
                        filePath,
                        content: base64,
                        message: `Upload datasheet ${file.name}`,
                    }),
                });
                if (res.ok) {
                    setSuccessMessage('Upload successful');
                    setShowSuccessModal(true);
                    setTimeout(() => window.location.reload(), 1200);
                } else {
                    setErrorMessage('Upload failed');
                    setShowErrorModal(true);
                }
            };
            reader.readAsDataURL(file);
        } catch (err) {
            setErrorMessage('Upload error');
            setShowErrorModal(true);
        }
        setLoading(false);
    }

    async function deleteDatasheet(datasheet) {
        setLoading(true);
        try {
            const res = await fetch('/api/github-deletedatasheet', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    githubConfig,
                    filePath: `${githubConfig.datasheets}/${datasheet.originalFileName}`,
                    message: `Delete datasheet ${datasheet.originalFileName}`,
                }),
            });
            if (res.ok) {
                setSuccessMessage('Deleted successfully');
                setShowSuccessModal(true);
                setTimeout(() => window.location.reload(), 1200);
            } else {
                setErrorMessage('Delete failed');
                setShowErrorModal(true);
            }
        } catch (err) {
            setErrorMessage('Delete error');
            setShowErrorModal(true);
        }
        setLoading(false);
    }

    return (

        <div className="min-h-screen bg-white shadow-xl">
            {/* Main header - with class for targeting */}

            <Header title="Component Datasheets" />

            {error ? (
                <div className="container mx-auto px-4 py-8">
                    <div className="text-red-600 bg-red-50 p-4 rounded-lg">
                        Error: {error}
                    </div>
                </div>
            ) : (


                <div className="px-2 py-2">
                    <div className="flex flex-row items-center justify-center sm:gap-4 gap-3">
                        <div className="relative">
                            <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                            <input
                                type="text"
                                placeholder="Search datasheets..."
                                // className="w-full min-w-[260px] max-w-xs pl-12 pr-4 py-3 border border-gray-500 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                                className="w-full pl-12 pr-4 py-2 border border-gray-500 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"

                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div>
                            <button
                                className="bg-blue-600 text-white px-2 py-2 rounded-full hover:bg-blue-700 w-full sm:w-auto flex items-center justify-center gap-1"
                                // onClick={() => document.getElementById('datasheet-upload-input').click()}
                                onClick={() => setShowAddProductModal(true)}

                            >
                                <PlusCircle className="w-5 h-5" />
                                <span className="hidden sm:inline">Add Files</span>
                            </button>
                            <input
                                id="datasheet-upload-input"
                                type="file"
                                accept=".pdf"
                                style={{ display: 'none' }}
                                onChange={async (e) => {
                                    if (e.target.files.length > 0) {
                                        await uploadDatasheet(e.target.files[0]);
                                        e.target.value = ""; // reset input
                                    }
                                }}
                            />
                        </div>

                    </div>
                </div>

            )}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="px-5 py-2 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDatasheets.map((datasheet) => (
                        <div
                            key={datasheet.id}
                            className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden border-t-4 ${quantityData[datasheet.id] === undefined
                                ? 'border-t-black'
                                : quantityData[datasheet.id] > 0
                                    ? 'border-t-green-600'
                                    : 'border-t-red-600'
                                }`}
                            onClick={() => openPdfModal(datasheet.downloadUrl)}
                        >

                            <div className="flex justify-between items-start space-x-4">
                                <div className="flex-1">
                                    <h3 className="font-semibold text-gray-800 mb-1 line-clamp-2">
                                        {datasheet.name}
                                    </h3>
                                    <p className={`text-sm font-medium ${quantityData[datasheet.id] === undefined
                                        ? 'text-black'
                                        : quantityData[datasheet.id] > 0
                                            ? 'text-green-600'
                                            : 'text-red-600'
                                        }`}>
                                        {datasheet.partNumber} ({quantityData[datasheet.id] ?? 'N/A'} available)
                                    </p>
                                </div>
                                <div className="relative">
                                    <ImagePreview
                                        url={getImageUrl(datasheet)}
                                        alt={datasheet.partName || datasheet.manufacturerPart}
                                        handleClick={async (e) => {
                                            e.stopPropagation();
                                            const imageUrl = await getImageUrl(datasheet);
                                            openImageModal(imageUrl);
                                        }}
                                    />
                                </div>
                            </div>

                            <div className="mt-4 flex items-center justify-between">
                                <div className="text-xs text-gray-500 flex items-center">
                                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    {new Date(datasheet.updatedAt).toLocaleDateString()}
                                </div>
                                <div className="flex items-center gap-2">
                                    <button
                                        className="p-2 text-xs text-red-600 hover:text-red-300"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            setDatasheetToDelete(datasheet);
                                            setShowDeleteModal(true);
                                        }}
                                    >
                                        <Trash className="h-5 w-5" />
                                    </button>
                                    <a
                                        href={datasheet.downloadUrl}
                                        target="_blank"
                                        rel="noopener noreferrer"
                                        className="p-2 text-blue-600 hover:text-blue-300 rounded-lg "
                                        onClick={(e) => e.stopPropagation()}
                                    >
                                        <Download className="h-5 w-5 " />
                                    </a>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            )}

            {/* Modals */}
            <PdfViewerModal
                isOpen={isPdfModalOpen}
                pdfUrl={selectedPdf}
                onClose={() => setIsPdfModalOpen(false)}
            />

            <ImageModal
                isOpen={isImageModalOpen}
                imageUrl={selectedImage}
                altText="Component Image"
                onClose={() => setIsImageModalOpen(false)}
            />
            {
                showDeleteModal && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center shadow-xl ">
                        {/* className="fixed inset-0 z-50 overflow-hidden flex items-center justify-center p-4" */}

                        <div className="bg-white rounded-lg shadow-xl p-6 max-w-sm w-full">
                            <h2 className="text-lg font-semibold mb-4">Delete Datasheet</h2>
                            <p className="mb-6">Are you sure you want to delete <span className="font-bold">{datasheetToDelete?.name}</span>?</p>
                            <div className="flex justify-end gap-2">
                                <button
                                    className="px-4 py-2 rounded bg-gray-200 hover:bg-gray-300"
                                    onClick={() => setShowDeleteModal(false)}
                                >
                                    Cancel
                                </button>
                                <button
                                    className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                                    onClick={async () => {
                                        await deleteDatasheet(datasheetToDelete);
                                        setShowDeleteModal(false);
                                        setDatasheetToDelete(null);
                                    }}
                                >
                                    Delete
                                </button>
                            </div>
                        </div>
                    </div>
                )
            }

            {showSuccessModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center shadow-xl ">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-xs w-full text-center">
                        <div className="text-green-600 text-lg font-semibold mb-2">Success</div>
                        <div className="mb-4">{successMessage}</div>
                        <button
                            className="px-4 py-2 rounded bg-green-600 text-white hover:bg-green-700"
                            onClick={() => setShowSuccessModal(false)}
                        >
                            OK
                        </button>
                    </div>
                </div>
            )}
            {showErrorModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center shadow-xl ">
                    <div className="bg-white rounded-lg shadow-xl p-6 max-w-xs w-full text-center">
                        <div className="text-red-600 text-lg font-semibold mb-2">Error</div>
                        <div className="mb-4">{errorMessage}</div>
                        <button
                            className="px-4 py-2 rounded bg-red-600 text-white hover:bg-red-700"
                            onClick={() => setShowErrorModal(false)}
                        >
                            Close
                        </button>
                    </div>
                </div>
            )}


                      {showAddProductModal && (
                <div className="fixed inset-0 z-50 flex items-center justify-center shadow-xl ">
                    <div className="relative max-w-md w-full">
                        {/* Accent bar */}
                        <div className="absolute -top-2 left-1/2 -translate-x-1/2 w-32 h-2 rounded-full bg-gradient-to-r from-blue-400 via-blue-600 to-blue-400 blur-sm opacity-70"></div>
                        <div className="bg-white/80 backdrop-blur-xl rounded-2xl shadow-2xl border border-blue-200 p-8 animate-[fadeInScale_0.3s_ease]">
                            <button
                                className="absolute top-4 right-4 text-gray-400 hover:text-blue-700 transition-colors"
                                onClick={() => setShowAddProductModal(false)}
                                aria-label="Close"
                            >
                                <X className="w-6 h-6" />
                            </button>
                            <div className="flex flex-col items-center mb-6">
                                <div className="bg-blue-100 rounded-full p-3 mb-2 shadow">
                                    <PlusCircle className="w-8 h-8 text-blue-600" />
                                </div>
                                <h2 className="text-2xl font-bold text-blue-700 mb-1">Add New Product</h2>
                                <p className="text-gray-500 text-sm text-center">Fill in the details below to add a new part to your inventory.</p>
                            </div>
                            <form
                                onSubmit={async (e) => {
                                    e.preventDefault();
                                    setIsSavingProduct(true);
                                    await saveMinimalProduct();
                                    setIsSavingProduct(false);
                                }}
                                className="space-y-5"
                            >
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-blue-700">Part Name<span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition bg-white/70"
                                        value={addProductForm.partName}
                                        onChange={e => setAddProductForm(f => ({ ...f, partName: e.target.value }))}
                                        placeholder="e.g. 74HC595"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-blue-700">Manufacturer Part<span className="text-red-500">*</span></label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-200 focus:outline-none transition bg-white/70"
                                        value={addProductForm.manufacturerPart}
                                        onChange={e => setAddProductForm(f => ({ ...f, manufacturerPart: e.target.value }))}
                                        placeholder="e.g. SN74HC595N"
                                    />
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-blue-700">Image</label>
                                    <div className="flex items-center gap-3">
                                        <input
                                            type="file"
                                            accept="image/*"
                                            className="block w-full border border-blue-200 rounded-lg text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                            onChange={e => {
                                                const file = e.target.files[0];
                                                if (!file) return;
                                                setAddProductImagePreview(URL.createObjectURL(file));
                                                const reader = new FileReader();
                                                reader.onload = (event) => {
                                                    const base64String = event.target.result;
                                                    const base64Data = base64String.split(',')[1];
                                                    setAddProductForm(f => ({
                                                        ...f,
                                                        image: file.name,
                                                        imageData: base64Data,
                                                        imageType: file.type
                                                    }));
                                                };
                                                reader.readAsDataURL(file);
                                            }}
                                        />
                                        {addProductImagePreview && (
                                            <img src={addProductImagePreview} alt="Preview" className="h-12 w-12 object-contain rounded border border-blue-200 shadow" />
                                        )}
                                    </div>
                                </div>
                                <div>
                                    <label className="block text-sm font-semibold mb-1 text-blue-700">Datasheet</label>
                                    <input
                                        type="file"
                                        accept=".pdf"
                                        className="block w-full text-sm border border-blue-200 rounded-lg text-gray-500 file:mr-4 file:py-2 file:px-4 file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                                        onChange={e => {
                                            const file = e.target.files[0];
                                            if (!file) return;
                                            setAddProductDatasheetName(file.name);
                                            const reader = new FileReader();
                                            reader.onload = (event) => {
                                                const base64String = event.target.result;
                                                const base64Data = base64String.split(',')[1];
                                                setAddProductForm(f => ({
                                                    ...f,
                                                    datasheet: file.name,
                                                    datasheetData: base64Data,
                                                    datasheetType: file.type
                                                }));
                                            };
                                            reader.readAsDataURL(file);
                                        }}
                                    />
                                    {addProductDatasheetName && (
                                        <div className="text-xs mt-1 text-blue-600">{addProductDatasheetName}</div>
                                    )}
                                </div>
                                <div className="flex justify-end gap-2 mt-6">
                                    <button
                                        type="button"
                                        className="px-4 py-2 rounded-lg bg-gray-200 text-gray-700 hover:bg-gray-300 transition"
                                        onClick={() => setShowAddProductModal(false)}
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        className="px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white font-semibold hover:from-blue-600 hover:to-blue-800 shadow transition"
                                        disabled={isSavingProduct}
                                    >
                                        {isSavingProduct ? (
                                            <span className="flex items-center gap-2">
                                                <svg className="animate-spin h-5 w-5 text-white" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
                                                </svg>
                                                Saving...
                                            </span>
                                        ) : "Save"}
                                    </button>
                                </div>
                            </form>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );


}