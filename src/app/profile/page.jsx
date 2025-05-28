"use client";
import { useState, useEffect } from "react";
import { Save } from "lucide-react";
import { auth } from "@/config/firebase"; // Adjust the path to your firebase.js file
import githubConfig from "@/config/githubConfig"; // Import the updated githubConfig

const ProfilePage = () => {
  const [formData, setFormData] = useState({
    name: "John Doe",
    email: "john.doe@example.com",
    phone: "(555) 123-4567",
    address: "123 Main Street, Springfield, USA",
    company: "Doe Enterprises",
    position: "Manager",
  });
  const [userId, setUserId] = useState(""); // State to store the User ID
  const [githubPath, setGithubPath] = useState(""); // State to store the GitHub path
  const [config, setConfig] = useState(null); // State to store the GitHub config

  // Fetch the User ID and generate the GitHub path
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const uid = currentUser.uid; // Get the Firebase user ID
      const email = currentUser.email; // Get the email address
      const username = email.split("@")[0]; // Extract the username from the email
      setUserId(uid); // Set the User ID
      const path = `${username}-${uid}`; // Generate the GitHub path
      setGithubPath(path); // Set the GitHub path
      setConfig(githubConfig(username, uid)); // Generate the GitHub config dynamically
    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleSave = (e) => {
    e.preventDefault();
    // Save logic (e.g., send data to the backend or update local storage)
    alert("Profile updated successfully!");
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-lg">
        <h1 className="text-2xl font-bold text-center mb-6">My Profile</h1>
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            {/* User ID */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                User ID
              </label>
              <input
                type="text"
                value={userId}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 focus:outline-none"
              />
            </div>

            {/* GitHub Path */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GitHub Path
              </label>
              <input
                type="text"
                value={githubPath}
                readOnly
                className="w-full px-3 py-2 border border-gray-300 rounded bg-gray-100 focus:outline-none"
              />
            </div>

            {/* Full Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Email Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Phone Number
              </label>
              <input
                type="tel"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Address */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Address
              </label>
              <input
                type="text"
                name="address"
                value={formData.address}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Company */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Company
              </label>
              <input
                type="text"
                name="company"
                value={formData.company}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>

            {/* Position */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Position
              </label>
              <input
                type="text"
                name="position"
                value={formData.position}
                onChange={handleInputChange}
                className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <div className="mt-6">
            <button
              type="submit"
              className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              <Save className="h-4 w-4 mr-2" />
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ProfilePage;