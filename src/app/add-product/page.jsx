"use client";
import Header from "@/components/Header";
import { useState, useEffect, useRef } from "react";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle, Github, PlusCircle, Search, Home } from "lucide-react";
import Addproductform from "@/components/Addproductform";
import githubConfigImport from '@/config/githubConfig';

const AddInventoryForm = () => {
    const [formData, setFormData] = useState({
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
        quantity: "",
        customerRef: "",
        description: "",
        bin: "",
        reorderPoint: "",
        reorderQty: "",
        costPrice: "",
        salePrice: "",
        category: ""
    });
    const [scrolled, setScrolled] = useState(false);
    const [showGithubConfig, setShowGithubConfig] = useState(false);
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [githubConfig, setGithubConfig] = useState(githubConfigImport);

    const handleGithubConfigChange = (e) => {
        const { name, value } = e.target;
        setGithubConfig(prev => ({
            ...prev,
            [name]: value
        }));
    };
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
            <Header title="Inventory Management System" />


            {/* Fixed action bar that appears on scroll */}
            <div className={`${scrolled ? 'fixed top-0 left-0 right-0 z-50  shadow-md' : 'relative'} bg-gray-300 shadow-md py-3 px-6`}>
                <div className="bg-gray-300  flex justify-between items-center">
                    <div className="flex items-center space-x-4">

                        <h2 className="text-2xl font-bold text-black flex items-center">
                            <PlusCircle className="mr-2 h-5 w-5" /> Add Product
                        </h2>
                    </div>
                    <div className="flex space-x-3">
                        <button
                            type="button"
                            onClick={() => setShowGithubConfig(!showGithubConfig)}
                            className="flex items-center px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200"
                        >
                            <Github className="h-4 w-4 mr-2" />
                            {showGithubConfig ? "Hide GitHub Config" : "Show GitHub Config"}
                        </button>
                        <button
                            type="button"
                            onClick={() => document.getElementById('resetFormButton').click()}
                            className="flex items-center px-3 py-1 text-sm bg-yellow-100 text-yellow-700 rounded-md hover:bg-yellow-200"
                        >
                            <AlertCircle className="h-4 w-4 mr-2" />
                            Reset
                        </button>
                        <button
                            type="submit"
                            form="inventoryForm"
                            disabled={isSubmitting}
                            className="flex items-center px-4 py-1 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:bg-gray-400"
                        >
                            <ShoppingCart className="h-4 w-4 mr-2" />
                            {isSubmitting ? "Saving..." : "Add to Inventory"}
                        </button>
                    </div>
                </div>
            </div>
            {formData.createdAt && (
                <div className="mt-4 text-sm text-gray-500">
                    <p>Item created on: {new Date(formData.createdAt).toLocaleString()}</p>
                </div>
            )}
            {/* GitHub Configuration Section */}
            {showGithubConfig && (
                <div className="px-6 py-4 bg-gray-50 border-b border-gray-200">
                    <h3 className="text-lg font-medium text-gray-800 mb-3">GitHub Configuration</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Token</label>
                            <input
                                type="password"
                                name="token"
                                value={githubConfig.token}
                                onChange={handleGithubConfigChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="GitHub Personal Access Token"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Owner</label>
                            <input
                                type="text"
                                name="owner"
                                value={githubConfig.owner}
                                onChange={handleGithubConfigChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="GitHub Username or Org"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Repository</label>
                            <input
                                type="text"
                                name="repo"
                                value={githubConfig.repo}
                                onChange={handleGithubConfigChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="Repository Name"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
                            <input
                                type="text"
                                name="branch"
                                value={githubConfig.branch}
                                onChange={handleGithubConfigChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="main"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Path</label>
                            <input
                                type="text"
                                name="path"
                                value={githubConfig.path}
                                onChange={handleGithubConfigChange}
                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                placeholder="inventory"
                            />
                        </div>
                    </div>
                </div>
            )}
            <Addproductform />
        </div>
    );
};

export default AddInventoryForm;