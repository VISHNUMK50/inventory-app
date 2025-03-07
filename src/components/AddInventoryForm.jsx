"use client";

import { useState } from "react";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle } from "lucide-react";

const AddInventoryForm = () => {
  const [formData, setFormData] = useState({
    image: "",
    datasheet: "",
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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleImageUpload = (e) => {
    // For demo purposes only
    setFormData({ ...formData, image: "/api/placeholder/120/120" });
  };

  const handleDatasheetUpload = (e) => {
    // For demo purposes only
    setFormData({ ...formData, datasheet: "#" });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Inventory Data Submitted:", formData);
    alert("Inventory item saved successfully!");
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
                      {formData.image ? (
                        <img src={formData.image} alt="Preview" className="h-24 w-24 rounded-md object-cover border-2 border-blue-200" />
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
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Part Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    name="partName" 
                    value={formData.partName} 
                    onChange={handleChange} 
                    required 
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500" 
                    placeholder="e.g. ATmega328P, 10K Resistor, etc."
                  />
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
                  {formData.datasheet && (
                    <a href={formData.datasheet} className="ml-3 text-blue-600 hover:underline inline-flex items-center">
                      <Clipboard className="h-4 w-4 mr-1" /> View Datasheet
                    </a>
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
              className="px-6 py-2 bg-gradient-to-r from-blue-600 to-indigo-700 text-white rounded-md hover:from-blue-700 hover:to-indigo-800 transition-colors shadow-md"
            >
              Save Inventory Item
            </button>
          </div>
        </div>
      </form>
    </div>
  );
};

export default AddInventoryForm;