"use client";

import { useState, useEffect, useRef } from "react";
import { Clipboard, Folder, Package, DollarSign, Tag, MapPin, ShoppingCart, AlertCircle, Github, PlusCircle, Search, Home } from "lucide-react";
import githubConfigImport from '../config/githubConfig';

const SavingModal = ({ isSuccess }) => {
  return (
    <div className="fixed inset-0 overflow-y-auto h-full w-full z-50 flex items-center justify-center">
      <div className="relative bg-white rounded-lg p-8 m-4 max-w-sm flex flex-col items-center shadow-xl border border-gray-200">
        {!isSuccess ? (
          <>
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mb-4"></div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Adding to Inventory...</h3>
            <p className="text-gray-600">Please wait while we process your item</p>
          </>
        ) : (
          <>
            <div className="h-12 w-12 rounded-full bg-green-100 flex items-center justify-center mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Item Added Successfully!</h3>
            <p className="text-gray-600">The inventory has been updated</p>
          </>
        )}
      </div>
    </div>
  );
};

const Addproductform = () => {
  // Main form data state
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
  const [showSavingModal, setShowSavingModal] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const resetForm = () => {
    // Reset form data
    setFormData({
      id: "",  // Add this line
      partName: "",
      createdAt: "",
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
    // Reset file input values
    const imageInput = document.getElementById('image-upload');
    const datasheetInput = document.getElementById('datasheet-upload');
    if (imageInput) imageInput.value = '';
    if (datasheetInput) datasheetInput.value = '';
  };
  // New state for tracking the last used ID
  const [lastUsedId, setLastUsedId] = useState(0);
  const fetchLastUsedId = async () => {
    try {
      const { token, repo, owner, path } = githubConfig;

      if (!token || !repo || !owner) {
        const savedId = localStorage.getItem('lastUsedId');
        setLastUsedId(savedId ? parseInt(savedId) : 0);
        return;
      }

      const idTrackerPath = `${path}/lastUsedId.json`;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${idTrackerPath}`;

      const response = await fetch(apiUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (response.status === 404) {
        setLastUsedId(0);
        return;
      }

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const data = await response.json();
      const content = JSON.parse(atob(data.content));
      const fetchedId = parseInt(content.lastUsedId) || 0;
      setLastUsedId(fetchedId);
      localStorage.setItem('lastUsedId', fetchedId.toString());

    } catch (error) {
      console.error("Error fetching last used ID:", error);
      const savedId = localStorage.getItem('lastUsedId');
      setLastUsedId(savedId ? parseInt(savedId) : 0);
    }
  };


  useEffect(() => {
    fetchDropdownOptionsFromGithub();
    fetchLastUsedId(); // Add this line
  }, []);



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

      // Update form data with the new value
      setFormData({ ...formData, [field]: value });

      // Clear the new entry input
      setNewEntries({ ...newEntries, [field]: "" });

      // Reset adding field state
      setAddingField(null);

      // Save updated options to GitHub
      saveDropdownOptionsToGithub(updatedOptions);
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
        await saveToGithub();
      } catch (error) {
        console.error("Error saving dropdown options:", error);
        // Save to localStorage as fallback
        localStorage.setItem('dropdownOptions', JSON.stringify(updatedOptions));
      }
    }

    return hasUpdates; // Return whether updates were made
  };



  // Function to check if an item already exists
  const checkItemExists = async () => {
    const { token, repo, owner, branch, path } = githubConfig;

    if (!token || !repo || !owner) {
      return false; // Can't check, assume it doesn't exist
    }

    try {
      // We'll look for matching manufacturer part and part name, regardless of ID
      const sanitizedManufacturerPart = formData.manufacturerPart.replace(/[^a-z0-9]/gi, "_");
      const sanitizedPartName = formData.partName.replace(/[^a-z0-9\s]/gi, "-").replace(/\s+/g, "_");

      // Use a prefix pattern to match items with the same part name and manufacturer part
      // but potentially different IDs
      const filePattern = `-${sanitizedPartName}-${sanitizedManufacturerPart}.json`;

      // List all files in the jsons directory
      const listUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${path}/jsons`;

      const response = await fetch(listUrl, {
        headers: {
          "Authorization": `token ${token}`
        }
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${response.statusText}`);
      }

      const files = await response.json();

      // Find a file that matches our pattern
      const matchingFile = files.find(file => file.name.includes(filePattern));

      if (matchingFile) {
        // Found a match, fetch its content
        const fileResponse = await fetch(matchingFile.url, {
          headers: {
            "Authorization": `token ${token}`
          }
        });

        if (fileResponse.ok) {
          const fileData = await fileResponse.json();
          const content = atob(fileData.content);
          const existingItem = JSON.parse(content);

          // Return the existing item
          return existingItem;
        }
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

    if (!formData.partName || !formData.manufacturer || !formData.manufacturerPart) {
      alert("Please fill all required fields: Part Name, Manufacturer, and Manufacturer Part#");
      return;
    }

    setIsSubmitting(true);

    try {
      // Create an object to track which fields have new values
      const newValues = {
        partNames: formData.partName,
        manufacturers: formData.manufacturer,
        vendors: formData.vendor,
        manufacturerParts: formData.manufacturerPart
      };

      // Check each field and update dropdownOptions if it's a new value
      let hasNewValues = false;
      const updatedOptions = { ...dropdownOptions };

      Object.entries(newValues).forEach(([key, value]) => {
        if (value && !dropdownOptions[key].includes(value)) {
          updatedOptions[key] = [...dropdownOptions[key], value];
          hasNewValues = true;
        }
      });

      // If we have new values, update dropdownOptions and save to GitHub
      if (hasNewValues) {
        setDropdownOptions(updatedOptions);
        await saveDropdownOptionsToGithub(updatedOptions);
      }

      // Continue with the rest of your submit logic...
      await processNewEntries();
      const existingItem = await checkItemExists();
      // ... rest of your existing submit logic ...

    } catch (error) {
      console.error("Error during submission:", error);
      alert(`Error submitting form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // @@@@@@@@@@@@@@@@@@@     save files     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@

  const saveLastUsedIdToGithub = async (newId) => {
    try {
      const { token, repo, owner, path } = githubConfig;

      if (!token || !repo || !owner) {
        localStorage.setItem('lastUsedId', newId.toString());
        return;
      }

      const idTrackerPath = `${path}/lastUsedId.json`;
      const content = btoa(JSON.stringify({ lastUsedId: newId }));

      await saveFileToGithub(content, idTrackerPath, `Update last used ID to ${newId}`);
      localStorage.setItem('lastUsedId', newId.toString());
      setLastUsedId(newId);
    } catch (error) {
      console.error("Error saving last used ID:", error);
      localStorage.setItem('lastUsedId', newId.toString());
    }
  };

  // save drop down option
  const saveDropdownOptionsToGithub = async (optionsToSave = null) => {
    try {
      const { token, repo, owner, branch, path } = githubConfig;
      const options = optionsToSave || dropdownOptions;

      if (!token || !repo || !owner) {
        localStorage.setItem('dropdownOptions', JSON.stringify(options));
        return;
      }

      const optionsFilePath = `${path}/dropdownOptions.json`;
      const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${optionsFilePath}`;

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

      const content = btoa(JSON.stringify(options, null, 2));
      const requestBody = {
        message: "Update dropdown options",
        content: content,
        branch: branch
      };

      if (sha) {
        requestBody.sha = sha;
      }

      const response = await fetch(apiUrl, {
        method: "PUT",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(requestBody)
      });

      if (!response.ok) {
        throw new Error(`GitHub API error: ${await response.text()}`);
      }

      // Also update local storage
      localStorage.setItem('dropdownOptions', JSON.stringify(options));

    } catch (error) {
      console.error("Error saving dropdown options:", error);
      localStorage.setItem('dropdownOptions', JSON.stringify(options));
    }
  };
  // New function that accepts options parameter
  const saveOptionsToGithub = async (options) => {
    try {
      // Store options in localStorage for use in saveToGithub
      localStorage.setItem('dropdownOptions', JSON.stringify(options));

      // Create a minimal data object for the save
      const minimalData = {
        id: Date.now(), // Use timestamp as ID
        partName: "Options Update", // This is just for the commit message
        manufacturerPart: "Options-Update" // This is just for identifier
      };

      // Use the main saveToGithub function
      await saveToGithub(minimalData);
    } catch (error) {
      console.error("Error saving options:", error);
      throw error;
    }
  };
  let isSaving = false;
  /// save to github
  const saveToGithub = async (dataToSave = null) => {
    const { token, repo, owner, branch, path } = githubConfig;

    if (!token || !repo || !owner) {
      alert("Please fill in all GitHub configuration fields");
      return false;
    }
    if (isSaving) {
      console.log("Save already in progress, please wait");
      return false;
    }

    isSaving = true;
    setShowSavingModal(true); // Show the modal when starting to save
    setSaveSuccess(false); // Reset success state

    try {
      setIsSubmitting(true);
      const data = dataToSave || formData;

      // Get the current lastUsedId from state
      let currentId = parseInt(data.id) || 0;
      let newLastUsedId = Math.max(lastUsedId, currentId);

      // If this is a new item (not an update), increment the ID
      if (!dataToSave) {
        newLastUsedId = lastUsedId + 1;
        data.id = newLastUsedId.toString();
      }

      // Generate a unique identifier based on part number and timestamp
      const sanitizedManufacturerPart = data.manufacturerPart.replace(/[^a-z0-9]/gi, "_");
      const sanitizedPartName = data.partName.replace(/[^a-z0-9\s]/gi, "-").replace(/\s+/g, "_");
      const itemIdentifier = `${data.id}-${sanitizedPartName}-${sanitizedManufacturerPart}`;

      // Create a copy of data to modify before saving
      const finalDataToSave = { ...data };

      // Remove the base64 data from the JSON file
      delete finalDataToSave.imageData;
      delete finalDataToSave.datasheetData;

      // Prepare file updates array
      const fileUpdates = [];

      // Add image file if exists
      if (data.image && data.imageData) {
        const imageFilePath = `${path}/images/${itemIdentifier}_${data.image}`;
        finalDataToSave.image = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${imageFilePath}`;
        fileUpdates.push({
          path: imageFilePath,
          content: data.imageData
        });
      }

      // Add datasheet file if exists
      if (data.datasheet && data.datasheetData) {
        const datasheetFilePath = `${path}/datasheets/${itemIdentifier}_${data.datasheet}`;
        finalDataToSave.datasheet = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${datasheetFilePath}`;
        fileUpdates.push({
          path: datasheetFilePath,
          content: data.datasheetData
        });
      }

      // Add the JSON data file
      const jsonFilePath = `${path}/jsons/${itemIdentifier}.json`;
      const jsonContent = btoa(JSON.stringify(finalDataToSave, null, 2));
      fileUpdates.push({
        path: jsonFilePath,
        content: jsonContent
      });

      // Update the lastUsedId file
      const idTrackerPath = `${path}/lastUsedId.json`;
      const idContent = btoa(JSON.stringify({ lastUsedId: newLastUsedId }, null, 2));
      fileUpdates.push({
        path: idTrackerPath,
        content: idContent
      });

      // Create a single commit with all file changes
      await batchCommitToGithub(fileUpdates, `Add inventory item: ${data.partName} (ID: ${data.id}) with all related files`);

      // Update local state and storage
      setLastUsedId(newLastUsedId);
      localStorage.setItem('lastUsedId', newLastUsedId.toString());
      // After successful save, reset the form
      resetForm();
      setImagePreview(null);
      setDatasheetName(null);
      setSaveSuccess(true);

      // Wait 1.5 seconds to show success message before closing modal
      setTimeout(() => {
        setShowSavingModal(false);
        setSaveSuccess(false);
      }, 1000);

      return true;
    } catch (error) {
      console.error("Error saving to GitHub:", error);
      alert(`Error saving to GitHub: ${error.message}`);
      return false;
    } finally {
      isSaving = false;
      setIsSubmitting(false);

    }



  };
  // New function to handle batch commits
  const batchCommitToGithub = async (fileUpdates, commitMessage) => {
    const { token, repo, owner, branch } = githubConfig;

    // Get current tree SHA
    const refResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      headers: {
        "Authorization": `token ${token}`
      }
    });

    if (!refResponse.ok) {
      throw new Error(`Failed to get branch reference: ${await refResponse.text()}`);
    }

    const refData = await refResponse.json();
    const commitSha = refData.object.sha;

    // Get the commit to get the tree SHA
    const commitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits/${commitSha}`, {
      headers: {
        "Authorization": `token ${token}`
      }
    });

    const commitData = await commitResponse.json();
    const treeSha = commitData.tree.sha;

    // Create blobs for each file
    const newBlobs = await Promise.all(fileUpdates.map(async (file) => {
      const blobResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/blobs`, {
        method: "POST",
        headers: {
          "Authorization": `token ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          content: file.content,
          encoding: "base64"
        })
      });

      const blobData = await blobResponse.json();

      return {
        path: file.path,
        mode: "100644", // Regular file mode
        type: "blob",
        sha: blobData.sha
      };
    }));

    // Create a new tree
    const treeResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/trees`, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        base_tree: treeSha,
        tree: newBlobs
      })
    });

    const treeData = await treeResponse.json();

    // Create a commit
    const newCommitResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/commits`, {
      method: "POST",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        message: commitMessage,
        tree: treeData.sha,
        parents: [commitSha]
      })
    });

    const newCommitData = await newCommitResponse.json();

    // Update the reference
    const updateRefResponse = await fetch(`https://api.github.com/repos/${owner}/${repo}/git/refs/heads/${branch}`, {
      method: "PATCH",
      headers: {
        "Authorization": `token ${token}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        sha: newCommitData.sha,
        force: false
      })
    });

    if (!updateRefResponse.ok) {
      throw new Error(`Failed to update reference: ${await updateRefResponse.text()}`);
    }

    return newCommitData;
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

  // @@@@@@@@@@@@@@@@@@@     save files     @@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@@



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




  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">
      <button
        id="resetFormButton"
        type="button"
        onClick={resetForm}
        className="hidden"
      />
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
        {showSavingModal && <SavingModal isSuccess={saveSuccess} />}
      </form>
    </div>
  );
};

export default Addproductform;