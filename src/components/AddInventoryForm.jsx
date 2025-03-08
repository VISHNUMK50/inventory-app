"use client";

import { useState, useEffect, useRef } from "react";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle, Github, PlusCircle, Search, Home } from "lucide-react";
import Link from "next/link";
import githubConfigImport from '../config/githubConfig';

const AddInventoryForm = () => {
  // Main form data state
  const [formData, setFormData] = useState({
    image: "",
    imageData: "",
    imageType: "",
    datasheet: "",
    datasheetData: "",
    datasheetType: "",
    manufacturer: "",
    manufacturerPart: "",
    vendor: "",
    vendorProductLink: "", // Changed from vendorPart
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

  // State for dropdown suggestions - Added manufacturerPart
  const [suggestions, setSuggestions] = useState({
    partName: [],
    manufacturer: [],
    vendor: [],
    manufacturerPart: [] // Added suggestions for manufacturer parts
  });

  // State for new entries - Added manufacturerPart
  const [newEntries, setNewEntries] = useState({
    partName: "",
    manufacturer: "",
    vendor: "",
    manufacturerPart: "" // Added new entry field for manufacturer parts
  });

  // State for which field is currently being added to
  const [addingField, setAddingField] = useState(null);

  const [isSubmitting, setIsSubmitting] = useState(false);

  // GitHub config state - renamed to avoid conflict
  const [githubConfig, setGithubConfig] = useState(githubConfigImport);

  const [showGithubConfig, setShowGithubConfig] = useState(false);

  // New state to preview uploads
  const [imagePreview, setImagePreview] = useState(null);
  const [datasheetName, setDatasheetName] = useState(null);

  // Refs for tracking active dropdowns and focus - Added manufacturerPart
  const dropdownRefs = {
    partName: useRef(null),
    manufacturer: useRef(null),
    vendor: useRef(null),
    manufacturerPart: useRef(null) // Added ref for manufacturerPart dropdown
  };

  const inputRefs = {
    partName: useRef(null),
    manufacturer: useRef(null),
    vendor: useRef(null),
    manufacturerPart: useRef(null) // Added ref for manufacturerPart input
  };

  // Track whether user is actively using a dropdown
  const [activeDropdown, setActiveDropdown] = useState(null);

  // Load data from GitHub on component mount
  useEffect(() => {
    fetchDropdownOptionsFromGithub();
  }, []);

  // Controlled filter for suggestions when typing in fields
  const updateSuggestions = (field, value) => {
    if (value) {
      const fieldList = dropdownOptions[`${field}s`] || [];
      const filteredItems = fieldList.filter(name =>
        name.toLowerCase().includes(value.toLowerCase())
      );
      setSuggestions(prev => ({ ...prev, [field]: filteredItems }));
    } else {
      setSuggestions(prev => ({ ...prev, [field]: [] }));
    }
  };

  // Handle input changes with controlled suggestion updates
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });

    // Only update suggestions for these specific fields
    if (['partName', 'manufacturer', 'vendor', 'manufacturerPart'].includes(name)) {
      updateSuggestions(name, value);

      // Only show the dropdown when typing (prevent auto-open)
      if (value && !activeDropdown) {
        setActiveDropdown(name);
      }
    }
  };

  const fetchDropdownOptionsFromGithub = async () => {
    try {
      const { token, repo, owner, branch, path } = githubConfig;

      // Check if token and other required fields are available
      if (!token || !repo || !owner) {
        // Fall back to localStorage if GitHub config is not complete
        loadFromLocalStorage();
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
        loadFromLocalStorage();
        return;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();

      // Decode content from base64
      const content = atob(data.content);
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
      loadFromLocalStorage();
    }
  };

  const loadFromLocalStorage = () => {
    const savedOptions = localStorage.getItem('dropdownOptions');
    if (savedOptions) {
      const options = JSON.parse(savedOptions);

      // Ensure manufacturerParts exists in the options
      if (!options.manufacturerParts) {
        options.manufacturerParts = [];
      }

      setDropdownOptions(options);
    }
  };

  const saveDropdownOptionsToGithub = async () => {
    try {
      const { token, repo, owner, branch, path } = githubConfig;

      if (!token || !repo || !owner) {
        // Save to localStorage if GitHub config is not complete
        localStorage.setItem('dropdownOptions', JSON.stringify(dropdownOptions));
        return;
      }

      // Path to the dropdown options JSON file
      const optionsFilePath = `${path}/dropdownOptions.json`;

      // GitHub API URL for contents
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;

      // Always check for the latest version of the file
      let sha = '';
      try {
        const checkResponse = await fetch(apiUrl, {
          headers: {
            "Authorization": `token ${token}`
          }
        });

        if (checkResponse.ok) {
          const fileData = await checkResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        console.log("Creating new dropdown options file");
      }

      // Convert options to JSON and then to base64
      const content = btoa(JSON.stringify(dropdownOptions, null, 2));

      // Prepare request body
      const requestBody = {
        message: "Update dropdown options",
        content: content,
        branch: branch
      };

      // Always include sha if we have it
      if (sha) {
        requestBody.sha = sha;
      }

      // Make PUT request to GitHub API
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }

      console.log("Dropdown options saved to GitHub successfully");

      // Also save to localStorage as backup
      localStorage.setItem('dropdownOptions', JSON.stringify(dropdownOptions));

    } catch (error) {
      console.error("Error saving dropdown options:", error);
      // Save to localStorage as fallback
      localStorage.setItem('dropdownOptions', JSON.stringify(dropdownOptions));

      // Alert the user about the error
      alert(`Error saving to GitHub: ${error.message}. Try again or check your GitHub settings.`);
    }
  };

  // Single definition of the GitHub config change handler
  const handleGithubConfigChange = (e) => {
    const { name, value } = e.target;
    setGithubConfig({
      ...githubConfig,
      [name]: value
    });
  };

  const handleSelectSuggestion = (field, value) => {
    setFormData({ ...formData, [field]: value });
    // Clear suggestions and active dropdown
    setSuggestions({ ...suggestions, [field]: [] });
    setActiveDropdown(null);
  };

  // Method to explicitly close dropdowns when needed
  const closeDropdown = (field) => {
    setSuggestions(prev => ({ ...prev, [field]: [] }));
    setActiveDropdown(null);
  };

  // Method to explicitly open dropdowns when focused
  const openDropdown = (field) => {
    // Only update if we have a value to filter on
    if (formData[field]) {
      updateSuggestions(field, formData[field]);
      setActiveDropdown(field);
    }
  };

  const handleNewEntryChange = (e) => {
    const { name, value } = e.target;
    setNewEntries({ ...newEntries, [name]: value });
  };

  const addNewEntry = (field) => {
    const value = newEntries[field].trim();

    if (value && !dropdownOptions[`${field}s`].includes(value)) {
      // Create a new array by spreading to ensure React detects change
      const updatedFieldArray = [...dropdownOptions[`${field}s`], value];

      // Create a new object for the updated options
      const updatedOptions = {
        ...dropdownOptions,
        [`${field}s`]: updatedFieldArray
      };

      // Update state with the new object
      setDropdownOptions(updatedOptions);
      setFormData({ ...formData, [field]: value });
      setNewEntries({ ...newEntries, [field]: "" });
      setAddingField(null);

      // Save to GitHub and localStorage
      saveDropdownOptionsToGithub();
    }
  };

  const toggleAddField = (field) => {
    setAddingField(addingField === field ? null : field);
    if (addingField !== field) {
      // Focus the input field when showing it
      setTimeout(() => {
        const inputField = document.getElementById(`new-${field}`);
        if (inputField) inputField.focus();
      }, 10);
    }
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

  // Improved click outside handler for better dropdown control
  useEffect(() => {
    function handleClickOutside(event) {
      // Check if click is outside all dropdown components
      const isOutsideAllDropdowns =
        Object.keys(dropdownRefs).every(field =>
          !dropdownRefs[field].current ||
          !dropdownRefs[field].current.contains(event.target)
        );

      // Also check if click is on any of our input fields
      const isOnInputField =
        Object.keys(inputRefs).some(field =>
          inputRefs[field].current &&
          inputRefs[field].current.contains(event.target)
        );

      // If clicked outside all dropdown components and not on an input field
      if (isOutsideAllDropdowns && !isOnInputField) {
        setSuggestions({
          partName: [],
          manufacturer: [],
          vendor: [],
          manufacturerPart: []
        });
        setActiveDropdown(null);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  // Process new entries when submitting the form
  const processNewEntries = async () => {
    // Fields to check
    const fieldsToCheck = ['partName', 'manufacturer', 'vendor', 'manufacturerPart'];
    let hasUpdates = false;

    // Create a copy of current dropdown options
    const updatedOptions = { ...dropdownOptions };

    // Check each field
    fieldsToCheck.forEach(field => {
      const value = formData[field]?.trim();
      if (value && !updatedOptions[`${field}s`].includes(value) &&
        !updatedOptions[`${field}s`].some(item =>
          item.toLowerCase() === value.toLowerCase()
        )) {
        // Add to dropdown options with a new array to ensure React detects change
        updatedOptions[`${field}s`] = [...updatedOptions[`${field}s`], value];
        hasUpdates = true;
      }
    });

    // Update state and save if there were changes
    if (hasUpdates) {
      // Update the state first
      setDropdownOptions(updatedOptions);

      // Instead of immediately trying to save, use the updated options directly
      try {
        // Create a modified version of saveDropdownOptionsToGithub that accepts options
        await saveOptionsToGithub(updatedOptions);
      } catch (error) {
        console.error("Error saving dropdown options:", error);
        // Save to localStorage as fallback
        localStorage.setItem('dropdownOptions', JSON.stringify(updatedOptions));
      }
    }

    return hasUpdates; // Return whether updates were made
  };

  // New function that accepts options parameter
  const saveOptionsToGithub = async (options) => {
    try {
      const { token, repo, owner, branch, path } = githubConfig;

      if (!token || !repo || !owner) {
        // Save to localStorage if GitHub config is not complete
        localStorage.setItem('dropdownOptions', JSON.stringify(options));
        return;
      }

      // Path to the dropdown options JSON file
      const optionsFilePath = `${path}/dropdownOptions.json`;

      // GitHub API URL for contents
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;

      // Always check for the latest version of the file
      let sha = '';
      try {
        const checkResponse = await fetch(apiUrl, {
          headers: {
            "Authorization": `token ${token}`
          }
        });

        if (checkResponse.ok) {
          const fileData = await checkResponse.json();
          sha = fileData.sha;
        }
      } catch (error) {
        console.log("Creating new dropdown options file");
      }

      // Convert options to JSON and then to base64
      const content = btoa(JSON.stringify(options, null, 2));

      // Prepare request body
      const requestBody = {
        message: "Update dropdown options",
        content: content,
        branch: branch
      };

      // Always include sha if we have it
      if (sha) {
        requestBody.sha = sha;
      }

      // Make PUT request to GitHub API
      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(`GitHub API error: ${errorData.message}`);
      }

      console.log("Dropdown options saved to GitHub successfully");

      // Also save to localStorage as backup
      localStorage.setItem('dropdownOptions', JSON.stringify(options));

    } catch (error) {
      throw error; // Re-throw the error to be handled by the caller
    }
  };

  // Function to check if an item already exists
  const checkItemExists = async () => {
    const { token, repo, owner, branch, path } = githubConfig;

    if (!token || !repo || !owner) {
      return false; // Can't check, assume it doesn't exist
    }

    try {
      // Generate the same identifier used for saving
      const sanitizedManufacturerPart = formData.manufacturerPart.replace(/[^a-z0-9]/gi, "_");
      const sanitizedPartName = formData.partName.replace(/[^a-z0-9\s]/gi, "-").replace(/\s+/g, "_");
      const itemIdentifier = `${sanitizedPartName}-${sanitizedManufacturerPart}`;

      // Path to the JSON file
      const jsonFilePath = `${path}/jsons/${itemIdentifier}.json`;

      // GitHub API URL for the file
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${jsonFilePath}`;

      // Check if the file exists
      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (response.ok) {
        // File exists, fetch its content
        const fileData = await response.json();
        const content = atob(fileData.content);
        const existingItem = JSON.parse(content);

        // Return the existing item
        return existingItem;
      }

      return false; // Item doesn't exist
    } catch (error) {
      console.error("Error checking if item exists:", error);
      return false;
    }
  };

  // Updated handleSubmit function with merge logic
  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate required fields
    if (!formData.partName || !formData.manufacturer || !formData.manufacturerPart) {
      alert("Please fill all required fields: Part Name, Manufacturer, and Manufacturer Part#");
      return;
    }

    setIsSubmitting(true);

    try {
      // First process any new entries and wait for completion
      await processNewEntries();

      // Check if a matching item already exists
      const existingItem = await checkItemExists();

      // If the item exists and matches critical fields, update the quantity
      if (existingItem &&
        existingItem.partName === formData.partName &&
        existingItem.manufacturer === formData.manufacturer &&
        existingItem.manufacturerPart === formData.manufacturerPart &&
        existingItem.vendor === formData.vendor) {

        // Parse quantities
        const existingQty = parseInt(existingItem.quantity) || 0;
        const newQty = parseInt(formData.quantity) || 0;

        // Create merged data, keeping most fields from existing item
        const mergedData = {
          ...existingItem,
          quantity: (existingQty + newQty).toString()
        };

        // Update form data with merged data
        setFormData(mergedData);

        alert(`This item already exists! Adding ${newQty} to the existing quantity of ${existingQty}.`);
      }

      // If GitHub config is shown, save to GitHub
      const success = await saveToGithub();
      if (success) {
        alert("Inventory item and associated files saved successfully to GitHub!");
        resetForm(); // Reset form after successful save
      }
      else {
        // Save dropdown options to localStorage at minimum
        localStorage.setItem('dropdownOptions', JSON.stringify(dropdownOptions));
        alert("Inventory item saved successfully to local state!");
        resetForm(); // Reset form after successful save
      }
    } catch (error) {
      console.error("Error during submission:", error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
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
      const sanitizedManufacturerPart = formData.manufacturerPart.replace(/[^a-z0-9]/gi, "_");
      const sanitizedPartName = formData.partName.replace(/[^a-z0-9\s]/gi, "-").replace(/\s+/g, "_");

      const itemIdentifier = `${sanitizedPartName}-${sanitizedManufacturerPart}`;

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

      // Explicitly make sure dropdown options are saved and WAIT for it to complete
      await saveDropdownOptionsToGithub();

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

    // First, try to get the current file to get the latest SHA
    let sha = '';
    try {
      const checkResponse = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (checkResponse.ok) {
        const fileData = await checkResponse.json();
        sha = fileData.sha;
      }
    } catch (error) {
      console.log("File doesn't exist yet, creating new file");
    }

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
        branch: branch,
        sha: sha // Include the latest SHA
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`GitHub API error: ${error.message}`);
    }

    return response.json();
  };

  const resetForm = () => {
    // Reset form data
    setFormData({
      image: "",
      imageData: "",
      imageType: "",
      datasheet: "",
      datasheetData: "",
      datasheetType: "",
      manufacturer: "",
      manufacturerPart: "",
      vendor: "",
      vendorProductLink: "", // Changed from vendorPart
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

    // Clear previews
    setImagePreview(null);
    setDatasheetName(null);

    // Reset new entries
    setNewEntries({
      partName: "",
      manufacturer: "",
      vendor: "",
      manufacturerPart: ""
    });

    // Clear suggestions
    setSuggestions({
      partName: [],
      manufacturer: [],
      vendor: [],
      manufacturerPart: []
    });

    // Reset active state
    setActiveDropdown(null);
  };



  // Improved autocomplete dropdown with controlled focus/blur behavior
  const renderAutocomplete = (field, label, required = false) => {
    return (
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
        <div className="relative">
          {addingField === field ? (
            <div className="flex items-center">
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
            <div>
              <div className="flex items-center">
                <div className="relative w-full" ref={dropdownRefs[field]}>
                  <input
                    type="text"
                    name={field}
                    ref={inputRefs[field]}
                    value={formData[field]}
                    onChange={handleChange}
                    onFocus={() => openDropdown(field)}
                    required={required}
                    className="autocomplete-input w-full px-3 py-2 border border-gray-300 rounded-l-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder={`Type to search or select ${field}`}
                    autoComplete="off"
                  />
                  {activeDropdown === field && suggestions[field].length > 0 && (
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
                </div>
                <button
                  type="button"
                  onClick={() => toggleAddField(field)}
                  className="px-3 py-2 bg-blue-100 text-blue-700 rounded-r-md hover:bg-blue-200 flex items-center"
                >
                  <PlusCircle className="h-4 w-4 mr-1" /> New
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
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

  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      {/* Main header - with class for targeting */}
      <header className="main-header bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
        <div className="mx-auto py-4 px-6">
          <div className="flex items justify-between">
            <div className="flex items-center space-x-2">
              <Package className="h-8 w-8" />
              <span className="text-2xl font-bold">InventoryPro</span>
            </div>
            <h2 className="ml-60 text-3xl font-bold">
              Inventory Management System
            </h2>
            <div className="flex items-center">
              <Link href="/" className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center">
                <Home className="h-4 w-4 mr-2" /> Back to Dashboard
              </Link>
              <span className="mr-4">Welcome, Admin</span>
              <button className="bg-blue-600 px-4 py-2 rounded-md hover:bg-blue-700 transition">
                Logout
              </button>
            </div>
          </div>
        </div>
      </header>

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
              onClick={resetForm}
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

      {/* Main Form */}
      <form id="inventoryForm" onSubmit={handleSubmit} className="px-6 py-4">
        <div className="mb-4 ">
          <div className="grid grid-cols-1  md:grid-cols-2 lg:grid-cols-3 gap-3">
            <div className="bg-indigo-50 p-4 rounded-lg">
              <h3 className="font-medium text-blue-800 mb-3 flex items-center">
                <Tag className="mr-2 h-5 w-5" /> Product Identification
              </h3>
              <div className="space-y-4">

                {/* Part Name */}
                {renderAutocomplete("partName", "Part Name", true)}
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleChange}
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
                {/* Customer Reference */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Customer Reference
                  </label>
                  <textarea
                    name="customerRef"
                    value={formData.customerRef}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Customer part reference"
                  />
                </div>
              </div>

            </div>
            <div className="bg-pink-50 p-4 rounded-lg md:col-span-1 lg:col-span-2">
              <h3 className="font-medium text-indigo-800 mb-3 flex items-center">
                <Folder className="mr-2 h-5 w-5" /> Manufacturer Details
              </h3>
              <div className="space-y-4">
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">

                  {/* Manufacturer */}
                  {renderAutocomplete("manufacturer", "Manufacturer", true)}

                  {/* Manufacturer Part # */}
                  {renderAutocomplete("manufacturerPart", "Manufacturer Part #", true)}


                  {/* Vendor */}
                  {renderAutocomplete("vendor", "Vendor")}

                  {/* Vendor Product Link - Updated field */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Vendor Product Link
                    </label>
                    <input
                      type="text"
                      name="vendorProductLink"
                      value={formData.vendorProductLink}
                      onChange={handleChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                      placeholder="https://vendor.com/product/123"
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
                    value={formData.description}
                    onChange={handleChange}
                    rows="2"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="Brief description of the part"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mb-4">
          <div className="bg-green-50 p-4 rounded-lg ">
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
                    value={formData.costPrice}
                    onChange={handleChange}
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
                    value={formData.salePrice}
                    onChange={handleChange}
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
                      value={formData.quantity}
                      onChange={handleChange}
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
                      value={formData.bin}
                      onChange={handleChange}
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
                      value={formData.reorderPoint}
                      onChange={handleChange}
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
                      value={formData.reorderQty}
                      onChange={handleChange}
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
                      <p className="text-xs text-gray-500">{formData.image}</p>
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
                      />
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        
      </form>
    </div>
  );
};

export default AddInventoryForm;