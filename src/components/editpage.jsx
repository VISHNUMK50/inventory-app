"use client";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle, Github, PlusCircle, Search, Home } from "lucide-react";
import { useState, useEffect } from "react";
// Remove the problematic import
// import { use } from "react"; // Import React.use


const Editform = ({ params }) => {
  const [editedProduct, setEditedProduct] = useState(null);
  // Replace the use() hook with a safer approach
  const partName = params?.partName ? decodeURIComponent(params.partName) : null;

  // Initialize editedProduct with default values if it's null
  useEffect(() => {
    if (!editedProduct) {
      setEditedProduct({
        partName: partName || "",
        category: "",
        customerRef: "",
        manufacturer: "",
        manufacturerPart: "",
        vendor: "",
        vendorPart: "",
        description: "",
        costPrice: "",
        salePrice: "",
        quantity: "0",
        bin: "",
        reorderPoint: "",
        reorderQty: ""
      });
    }
  }, [partName, editedProduct]);

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setEditedProduct(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Updated handleSubmit function with merge logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Make sure editedProduct is not null before proceeding
    if (!editedProduct) {
      alert("Product data is not loaded yet. Please try again.");
      return;
    }

    // Validate required fields
    if (!editedProduct.partName || !editedProduct.manufacturer || !editedProduct.manufacturerPart) {
      alert("Please fill all required fields: Part Name, Manufacturer, and Manufacturer Part#");
      return;
    }

    // Set a submission state if needed
    // const [isSubmitting, setIsSubmitting] = useState(false);
    // setIsSubmitting(true);

    try {
      // Your existing submission logic
      console.log("Submitting product:", editedProduct);
      // Replace with your actual submission code
      
      alert("Product updated successfully!");
      // Reset or navigate as needed
    } catch (error) {
      console.error("Error during submission:", error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      // setIsSubmitting(false);
    }
  };  

  // Return early with loading state if editedProduct is not yet initialized
  if (!editedProduct) {
    return <div className="p-6 text-center">Loading product data...</div>;
  }

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      <form id="inventoryForm" onSubmit={handleSubmit} className="px-6 py-4">
        <div className="mb-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {/* Product Identification Section */}
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <Tag className="mr-2 h-5 w-5" /> Product Identification
              </h3>
              <div className="space-y-4">
                {/* Part Name */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Name
                  </label>
                  <input
                    type="text"
                    name="partName"
                    value={editedProduct.partName || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editedProduct.category || ""}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                
                {/* Customer Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Reference
                  </label>
                  <textarea
                    name="customerRef"
                    value={editedProduct.customerRef || ""}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer part reference"
                  />
                </div>
              </div>
            </div>
            
            {/* Manufacturer Details Section */}
            <div className="bg-pink-50 p-4 rounded-lg md:col-span-1 lg:col-span-2">
              <h3 className="font-medium text-indigo-800 mb-3 flex items-center">
                <Folder className="mr-2 h-5 w-5" /> Manufacturer Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                  {/* Manufacturer */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer
                    </label>
                    <input
                      type="text"
                      name="manufacturer"
                      value={editedProduct.manufacturer || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Manufacturer Part */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Manufacturer Part #
                    </label>
                    <input
                      type="text"
                      name="manufacturerPart"
                      value={editedProduct.manufacturerPart || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Vendor */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor
                    </label>
                    <input
                      type="text"
                      name="vendor"
                      value={editedProduct.vendor || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  
                  {/* Vendor Part */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Part #
                    </label>
                    <input
                      type="text"
                      name="vendorPart"
                      value={editedProduct.vendorPart || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                </div>
                
                {/* Description */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Description
                  </label>
                  <textarea
                    name="description"
                    value={editedProduct.description || ""}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the part"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Pricing Information Section */}
        <div className="mb-4">
          <div className="bg-green-50 p-4 rounded-lg">
            <h3 className="font-medium text-green-800 mb-3 flex items-center">
              <DollarSign className="mr-2 h-5 w-5" /> Pricing Information
            </h3>
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {/* Cost Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <DollarSign className="h-4 w-4 mr-1" />
                      <span>Cost Price</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    name="costPrice"
                    value={editedProduct.costPrice || ""}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
                
                {/* Sale Price */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    <div className="flex items-center">
                      <Tag className="h-4 w-4 mr-1" />
                      <span>Sale Price</span>
                    </div>
                  </label>
                  <input
                    type="number"
                    name="salePrice"
                    value={editedProduct.salePrice || ""}
                    onChange={handleInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="0.00"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Inventory Details Section */}
        <div className="mb-4">
          <div className="space-y-4">
            <div className="bg-purple-50 p-4 rounded-lg">
              <h3 className="font-medium text-purple-800 mb-3 flex items-center">
                <MapPin className="mr-2 h-5 w-5" /> Inventory Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {/* Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Quantity
                    </label>
                    <input
                      type="number"
                      name="quantity"
                      value={editedProduct.quantity || "0"}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="0"
                      min="0"
                    />
                  </div>
                  
                  {/* Bin Location */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      <div className="flex items-center">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>Bin Location</span>
                      </div>
                    </label>
                    <input
                      type="text"
                      name="bin"
                      value={editedProduct.bin || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="A1-B2-C3"
                    />
                  </div>
                  
                  {/* Reorder Point */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Point
                    </label>
                    <input
                      type="number"
                      name="reorderPoint"
                      value={editedProduct.reorderPoint || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="5"
                      min="0"
                    />
                  </div>
                  
                  {/* Reorder Quantity */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Reorder Quantity
                    </label>
                    <input
                      type="number"
                      name="reorderQty"
                      value={editedProduct.reorderQty || ""}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="10"
                      min="0"
                    />
                  </div>
                </div>
              </div>
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
                  <div>
                    <label
                      htmlFor="image-upload"
                      className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <span>Upload Image</span>
                      <input
                        id="image-upload"
                        name="image"
                        type="file"
                        accept="image/*"
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
                  <div>
                    <Folder className="mx-auto h-12 w-12 text-gray-400" />
                    <p className="text-xs text-gray-500">PDF, DOC, XLS up to 10MB</p>
                  </div>
                  <div>
                    <label
                      htmlFor="datasheet-upload"
                      className="mt-2 cursor-pointer inline-flex items-center px-3 py-1 border border-transparent text-sm leading-4 font-medium rounded-md text-blue-700 bg-blue-100 hover:bg-blue-200"
                    >
                      <span>Upload Datasheet</span>
                      <input
                        id="datasheet-upload"
                        name="datasheet"
                        type="file"
                        className="sr-only"
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Submit Button */}
        <div className="mt-6 flex justify-end">
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            Save Changes
          </button>
        </div>
      </form>
    </div>
  );
};

export default Editform;