"use client";
import { useState, useEffect } from 'react';
import { FileText, Download, Search, AlertCircle, X } from 'lucide-react';
import githubConfigImport from '@/config/githubConfig';
import Header from "@/components/Header";
import { doc, getDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import { onAuthStateChanged } from "firebase/auth";

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


                <div className="px-5 py-5">
                    <div className="relative max-w-2xl mx-auto">
                        <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
                        <input
                            type="text"
                            placeholder="Search datasheets..."
                            className="w-full pl-12 pr-4 py-3 border border-gray-500 rounded-full bg-gray-50 focus:bg-white focus:ring-2 focus:ring-blue-100 focus:border-blue-400 transition-all duration-300"
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                        />
                    </div>
                </div>
            )}
            {loading ? (
                <div className="flex justify-center items-center h-64">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
            ) : (
                <div className="px-5 py-5 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {filteredDatasheets.map((datasheet) => (
                        <div
                            key={datasheet.id}
                            className={`bg-white border border-gray-200 rounded-xl p-6 hover:shadow-xl transition-all duration-300 cursor-pointer transform hover:-translate-y-1 relative overflow-hidden border-t-4 ${quantityData[datasheet.id] > 0
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
                                    <p className={`text-sm font-medium ${quantityData[datasheet.id] > 0
                                        ? 'text-green-600'
                                        : 'text-red-600'
                                        }`}>
                                        {datasheet.partNumber} ({quantityData[datasheet.id] || 0} available)
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
                                <a
                                    href={datasheet.downloadUrl}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="p-2 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <Download className="h-5 w-5 text-blue-600" />
                                </a>
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

        </div>
    );
}