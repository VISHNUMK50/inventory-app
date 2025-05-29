"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Upload, Camera } from "lucide-react";
import { auth } from "@/config/firebase"; // Adjust the path to your firebase.js file
import githubConfig from "@/config/githubConfig"; // Update import name
import Header from "@/components/Header"; // Adjust the import path as necessary
import Image from "next/image";


const ProfilePage = () => {
  const fileInputRef = useRef(null);

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
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  // Fetch the User ID and generate the GitHub path
  useEffect(() => {
    const currentUser = auth.currentUser;
    if (currentUser) {
      const uid = currentUser.uid;
      const email = currentUser.email;
      const username = email.split("@")[0];
      setUserId(uid);
      const path = `${username}-${uid}`;
      setGithubPath(path);
      // Remove the function call and just set the config
      setConfig(githubConfig);
      fetchProfileData(username);

    }
  }, []);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const fetchProfileData = async (username) => {
    try {
      const response = await fetch(`/api/profile/${username}`);
      if (response.ok) {
        const data = await response.json();
        setFormData(prev => ({ ...prev, ...data }));
        if (data.profilePhoto) {
          setPhotoPreview(data.profilePhoto);
        }
      }
    } catch (error) {
      console.error("Error loading profile data:", error);
    }
  };

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };
  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotoPreview(reader.result);
      };
      reader.readAsDataURL(file);

      try {
        // Upload photo to GitHub
        const formData = new FormData();
        formData.append('file', file);
        formData.append('path', `${githubPath}/profile/${file.name}`);

        const response = await fetch('/api/upload', {
          method: 'POST',
          body: formData
        });

        if (response.ok) {
          const { url } = await response.json();
          setFormData(prev => ({ ...prev, profilePhoto: url }));
        }
      } catch (error) {
        console.error("Error uploading photo:", error);
      } finally {
        setIsUploading(false);
      }
    }
  };


  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch(`/api/profile/save`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          data: formData,
          path: githubPath
        })
      });

      if (response.ok) {
        alert("Profile updated successfully!");
      }
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile");
    }
  };





  return (
    <div className="mx-auto bg-white shadow-xl overflow-hidden">      <Header title="My Profile" />

      <div className="flex flex-col items-center w-full gap-6">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col items-center">
          {/* Profile Photo Section */}
          <div className="relative mb-6">
            <div
              className="w-36 h-36 rounded-full border-4 border-blue-200 shadow-lg overflow-hidden flex items-center justify-center bg-gray-100 cursor-pointer hover:opacity-90 transition"
              onClick={handlePhotoClick}
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile"
                  fill
                  className="object-cover"
                />
              ) : (
                <Camera className="h-16 w-16 text-blue-300" />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
              </div>
            )}
            <button
              type="button"
              onClick={handlePhotoClick}
              className="absolute bottom-2 right-2 bg-blue-600 text-white rounded-full p-2 shadow hover:bg-blue-700 transition"
              title="Change Photo"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
          {/* Profile Info */}
          <form className="w-full space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">User ID</label>
                <input
                  type="text"
                  value={userId}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 mb-1">GitHub Path</label>
                <input
                  type="text"
                  value={githubPath}
                  readOnly
                  className="w-full px-3 py-2 border border-gray-200 rounded bg-gray-100 text-gray-500"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-400"
                />
              </div>
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="flex items-center justify-center w-full px-4 py-3 bg-blue-600 text-white rounded-lg font-semibold text-lg shadow hover:bg-blue-700 transition"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>      </div>

  );
};

export default ProfilePage;