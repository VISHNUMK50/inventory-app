"use client";

import { useState, useEffect } from "react";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle, Github, PlusCircle } from "lucide-react";

const AddInventoryForm = () => {
  const [formData, setFormData] = useState({
    image: "",
    imageData: "", // This will store base64 data
    imageType: "", // Store the MIME type
    datasheet: "",
    datasheetData: "", // This will store base64 data
    datasheetType: "", // Store the MIME type
    manufacturer: "",
    manufacturerPart: "",
    vendor: "",
    vendorPart: "",
    customerRef: "",
    description: "",
    bin: "",
    quantity: "",
    reorderPoint: "",
    reorderQty: "",
    costPrice: "",
    salePrice: "",
    category: "",
    partName: ""
  });
  
  // State for part name dropdown
  const [partNames, setPartNames] = useState([]);
  const [newPartName, setNewPartName] = useState("");
  const [isAddingNewPart, setIsAddingNewPart] = useState(false);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [githubConfig, setGithubConfig] = useState({
    token: "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",
    repo: "inventory-app",
    owner: "VISHNUMK50",
    branch: "master",
    path: "database"
  });
  const [showGithubConfig, setShowGithubConfig] = useState(false);
  
  // New state to preview uploads
  const [imagePreview, setImagePreview] = useState(null);
  const [datasheetName, setDatasheetName] = useState(null);

  // Load saved part names from localStorage on component mount
  useEffect(() => {
    const savedPartNames = localStorage.getItem('partNames');
    if (savedPartNames) {
      setPartNames(JSON.parse(savedPartNames));
    }
  }, []);

  // Save part names to localStorage whenever they change
  useEffect(() => {
    if (partNames.length > 0) {
      localStorage.setItem('partNames', JSON.stringify(partNames));
    }
  }, [partNames]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handlePartNameChange = (e) => {
    const value = e.target.value;
    setFormData({ ...formData, partName: value });
  };

  const handleNewPartNameChange = (e) => {
    setNewPartName(e.target.value);
  };

  const addNewPartName = () => {
    if (newPartName.trim() && !partNames.includes(newPartName.trim())) {
      const updatedPartNames = [...partNames, newPartName.trim()];
      setPartNames(updatedPartNames);
      setFormData({ ...formData, partName: newPartName.trim() });
      setNewPartName("");
      setIsAddingNewPart(false);
    }
  };

  const toggleAddNewPart = () => {
    setIsAddingNewPart(!isAddingNewPart);
    if (!isAddingNewPart) {
      // Focus the input field when showing it
      setTimeout(() => {
        const inputField = document.getElementById('new-part-name');
        if (inputField) inputField.focus();
      }, 10);
    }
  };

  const handleGithubConfigChange = (e) => {
    const { name, value } = e.target;
    setGithubConfig({ ...githubConfig, [name]: value });
  };

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
      
      setFormData({
        ...formData,
        image: file.name,
        imageData: base64Data,
        imageType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const handleDatasheetUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    // Update preview
    setDatasheetName(file.name);
    
    // Read file as base64
    const reader = new FileReader();
    reader.onload = (event) => {
      // Get base64 data without the prefix
      const base64String = event.target.result;
      const base64Data = base64String.split(',')[1];
      
      setFormData({
        ...formData,
        datasheet: file.name,
        datasheetData: base64Data,
        datasheetType: file.type
      });
    };
    reader.readAsDataURL(file);
  };

  const saveToGithub = async () => {
    const { token, repo, owner, branch, path } = githubConfig;
    
    if (!token || !repo || !owner) {
      alert("Please fill in all GitHub configuration fields");
      return false;
    }
    
    try {
      setIsSubmitting(true);
      
      // Generate a unique identifier based on part number and timestamp
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const sanitizedPartName = formData.manufacturerPart.replace(/[^a-z0-9]/gi, "-");
      const itemIdentifier = `${sanitizedPartName}_${timestamp}`;
      
      // Prepare file paths
      const jsonFilePath = `${path}/jsons/${itemIdentifier}.json`;
      
      // Create a copy of formData to modify before saving
      const dataToSave = { ...formData };
      
      // Remove the base64 data from the JSON file to avoid huge files
      delete dataToSave.imageData;
      delete dataToSave.datasheetData;
      
      // If we have image and datasheet files, update their paths to point to the GitHub URLs
      if (formData.image && formData.imageData) {
        const imageFilePath = `${path}/images/${itemIdentifier}_${formData.image}`;
        dataToSave.image = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imageFilePath}`;
        
        // Save the image file
        await saveFileToGithub(
          formData.imageData,
          imageFilePath,
          `Add image for ${formData.partName}`
        );
      }
      
      if (formData.datasheet && formData.datasheetData) {
        const datasheetFilePath = `${path}/datasheets/${itemIdentifier}_${formData.datasheet}`;
        dataToSave.datasheet = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${datasheetFilePath}`;
        
        // Save the datasheet file
        await saveFileToGithub(
          formData.datasheetData,
          datasheetFilePath,
          `Add datasheet for ${formData.partName}`
        );
      }
      
      // Save the JSON data
      const content = btoa(JSON.stringify(dataToSave, null, 2)); // Base64 encode
      await saveFileToGithub(
        content,
        jsonFilePath,
        `Add inventory item: ${formData.partName}`
      );
      
      return true;
    } catch (error) {
      console.error("Error saving to GitHub:", error);
      alert(`Error saving to GitHub: ${error.message}`);
      return false;
    } finally {
      setIsSubmitting(false);
    }
  };
  
  // Helper function to save a file to GitHub
  const saveFileToGithub = async (content, filePath, commitMessage) => {
    const { token, repo, owner, branch } = githubConfig;
    
    // GitHub API URL
    const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
    
    // Make the API request
    const response = await fetch(apiUrl, {
      method: "PUT",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: content,
        branch: branch
      })
    });
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }
    
    return response.json();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    console.log("Inventory Data Submitted:", formData);
    
    // If GitHub config is shown, save to GitHub
    if (showGithubConfig) {
      const success = await saveToGithub();
      if (success) {
        alert("Inventory item and associated files saved successfully to GitHub!");
      }
    } else {
      alert("Inventory item saved successfully to local state!");
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white shadow-xl rounded-xl overflow-hidden">
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 p-6 text-white">
        <h2 className="text-2xl font-bold flex items-center">
          <Package className="mr-2" /> Inventory Management System
        </h2>
        <p className="opacity-80">Add new items to your inventory database</p>
      </div>
      
      <form onSubmit={handleSubmit} className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Left column */}
          <div className="space-y-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <Tag className="mr-2 h-5 w-5" /> Product Identification
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Product Image</label>
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      {imagePreview ? (
                        <img src={imagePreview} alt="Preview" className="h-24 w-24 rounded-md object-cover border-2 border-blue-200" />
                      ) : (
                        <div className="h-24 w-24 rounded-md bg-gray-100 flex items-center justify-center border-2 border-dashed border-gray-300">
                          <span className="text-gray-400 text-sm text-center px-2">No image</span>
                        </div>
                      )}
                    </div>
                    <div className="flex-grow">
                      <input 
                        type="file" 
                        accept="image/*" 
                        onChange={handleImageUpload} 
                        className="hidden" 
                        id="image-upload" 
                      />
                      <label 
                        htmlFor="image-upload" 
                        className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition-colors"
                      >
                        Upload Image
                      </label>
                      {imagePreview && (
                        <p className="mt-1 text-sm text-gray-500">
                          {formData.image}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <div className="relative">
                    {isAddingNewPart ? (
                      <div className="flex items-center">
                        <input
                          type="text"
                          id="new-part-name"
                          value={newPartName}
                          onChange={handleNewPartNameChange}
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                          placeholder="Enter new part name"
                        />
                        <button
                          type="button"
                          onClick={addNewPartName}
                          className="px-3 py-2 bg-blue-500 text-white rounded-r-md hover:bg-blue-600"
                        >
                          Add
                        </button>
                      </div>
                    ) : (
                      <div className="flex items-center">
                        <select
                          name="partName"
                          value={formData.partName}
                          onChange={handlePartNameChange}
                          required
                          className="w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                        >
                          <option value="">Select Part Name</option>
                          {partNames.map((name) => (
                            <option key={name} value={name}>
                              {name}
                            </option>
                          ))}
                        </select>
                        <button
                          type="button"
                          onClick={toggleAddNewPart}
                          className="px-3 py-2 bg-blue-100 text-blue-700 rounded-r-md hover:bg-blue-200 flex items-center"
                        >
                          <PlusCircle className="h-4 w-4 mr-1" /> New
                        </button>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Product Category <span className="text-red-500">*</span>
                  </label>
                  <select 
                    name="category" 
                    value={formData.category} 
                    onChange={handleChange} 
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                  >
                    <option value="">Select Category</option>
                    <option value="IC">IC (Integrated Circuit)</option>
                    <option value="Resistor">Resistor</option>
                    <option value="Capacitor">Capacitor</option>
                    <option value="Transistor">Transistor</option>
                    <option value="Diode">Diode</option>
                    <option value="LED">LED</option>
                    <option value="Connector">Connector</option>
                    <option value="Switch">Switch</option>
                    <option value="Sensor">Sensor</option>
                    <option value="Microcontroller">Microcontroller</option>
                    <option value="PCB">PCB</option>
                    <option value="Battery">Battery</option>
                    <option value="Module">Module</option>
                    <option value="Tool">Tool</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Datasheet (PDF)</label>
                  <input 
                    type="file" 
                    accept="application/pdf" 
                    onChange={handleDatasheetUpload} 
                    className="hidden" 
                    id="datasheet-upload" 
                  />
                  <label 
                    htmlFor="datasheet-upload" 
                    className="inline-block px-4 py-2 bg-blue-100 text-blue-700 rounded-md cursor-pointer hover:bg-blue-200 transition-colors"
                  >
                    {formData.datasheet ? "Replace Datasheet" : "Upload Datasheet"}
                  </label>
                  {datasheetName && (
                    <div className="mt-1 text-sm text-gray-500 flex items-center">
                      <Clipboard className="h-4 w-4 mr-1" /> {datasheetName}
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-indigo-800 mb-3 flex items-center">
                <Folder className="mr-2 h-5 w-5" /> Manufacturer Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="manufacturer" 
                    value={formData.manufacturer} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Manufacturer Part# <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="manufacturerPart" 
                    value={formData.manufacturerPart} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor</label>
                  <select 
                    name="vendor" 
                    value={formData.vendor} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 bg-white"
                  >
                    <option value="">Select Vendor</option>
                    <option value="Vendor A">Vendor A</option>
                    <option value="Vendor B">Vendor B</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Vendor Part#</label>
                  <input 
                    type="text" 
                    name="vendorPart" 
                    value={formData.vendorPart} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Reference</label>
                  <input 
                    type="text" 
                    name="customerRef" 
                    value={formData.customerRef} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500" 
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Right column */}
          <div className="space-y-6">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-3 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Inventory Details
              </h3>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Bin Location</label>
                  <input 
                    type="text" 
                    name="bin" 
                    value={formData.bin} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Quantity</label>
                  <input 
                    type="number" 
                    name="quantity" 
                    value={formData.quantity} 
                    onChange={handleChange} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                  />
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center">
                        <AlertCircle className="h-4 w-4 mr-1" /> Reorder Point
                      </span>
                    </label>
                    <input 
                      type="number" 
                      name="reorderPoint" 
                      value={formData.reorderPoint} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <span className="flex items-center">
                        <ShoppingCart className="h-4 w-4 mr-1" /> Reorder Qty
                      </span>
                    </label>
                    <input 
                      type="number" 
                      name="reorderQty" 
                      value={formData.reorderQty} 
                      onChange={handleChange} 
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500" 
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <h3 className="font-medium text-green-800 mb-3 flex items-center">
                <DollarSign className="mr-2 h-5 w-5" /> Pricing Information
              </h3>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input 
                        type="number" 
                        name="costPrice" 
                        value={formData.costPrice} 
                        onChange={handleChange} 
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Sale Price</label>
                    <div className="relative">
                      <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                        <span className="text-gray-500">$</span>
                      </div>
                      <input 
                        type="number" 
                        name="salePrice" 
                        value={formData.salePrice} 
                        onChange={handleChange} 
                        step="0.01"
                        className="w-full pl-8 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500" 
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <h3 className="font-medium text-gray-800 mb-3">Product Description</h3>
              <textarea 
                name="description" 
                value={formData.description} 
                onChange={handleChange} 
                rows="4"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                placeholder="Enter detailed product description..."
              ></textarea>
            </div>
          </div>
        </div>
        
        {/* GitHub Configuration Toggle */}
        <div className="mt-6 flex items-center">
          <button
            type="button"
            onClick={() => setShowGithubConfig(!showGithubConfig)}
            className="flex items-center text-gray-700 bg-gray-100 px-4 py-2 rounded-md hover:bg-gray-200"
          >
            <Github className="h-4 w-4 mr-2" />
            {showGithubConfig ? "Hide GitHub Settings" : "Store Data on GitHub"}
          </button>
        </div>
        
        {/* GitHub Configuration Section */}
        {showGithubConfig && (
          <div className="mt-4 bg-gray-50 p-4 rounded-lg border border-gray-200">
            <h3 className="font-medium text-gray-800 mb-3 flex items-center">
              <Github className="mr-2 h-5 w-5" /> GitHub Integration Settings
            </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  GitHub Personal Access Token <span className="text-red-500">*</span>
                </label>
                <input 
                  type="password" 
                  name="token" 
                  value={githubConfig.token} 
                  onChange={handleGithubConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="ghp_xxxxxxxxxxxxxxxxxx"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Token requires repo scope permissions
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Name <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="repo" 
                  value={githubConfig.repo} 
                  onChange={handleGithubConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="inventory-data"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Repository Owner <span className="text-red-500">*</span>
                </label>
                <input 
                  type="text" 
                  name="owner" 
                  value={githubConfig.owner} 
                  onChange={handleGithubConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="username or organization"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Branch
                </label>
                <input 
                  type="text" 
                  name="branch" 
                  value={githubConfig.branch} 
                  onChange={handleGithubConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="main"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  File Path Directory
                </label>
                <input 
                  type="text" 
                  name="path" 
                  value={githubConfig.path} 
                  onChange={handleGithubConfigChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                  placeholder="inventory-data"
                />
              </div>
            </div>
          </div>
        )}

        <div className="mt-8 pt-5 border-t border-gray-200">
          <div className="flex justify-end space-x-3">
            <button 
              type="button" 
              className="px-5 py-2 bg-gray-200 text-gray-700 rounded-md hover:bg-gray-300 transition-colors"
            >
              Cancel
            </button>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className={`px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-md ${isSubmitting ? 'opacity-70 cursor-not-allowed' : ''}`}
            >
              {isSubmitting ? 'Saving...' : (showGithubConfig ? 'Save to GitHub' : 'Save Inventory Item')}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddInventoryForm;