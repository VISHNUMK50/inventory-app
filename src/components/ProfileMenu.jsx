"use client";
import { useState, useEffect, useRef } from "react";
import { User, Settings, HelpCircle, Moon, Sun, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth } from "../config/firebase"; // Adjust the path to your firebase.js file

const ProfileMenu = ({ darkMode, toggleDarkMode, onLogout }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null); // Reference to the menu container

  // Close the menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setProfileMenuOpen(false); // Close the menu
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    console.log("Logout clicked");
    auth.signOut()
        .then(() => {
            // Clear all items from localStorage
            localStorage.clear();
            // Redirect to root URL
            router.push('/');
        })
        .catch((error) => {
            console.error("Error signing out:", error);
        });
};

  return (
    <div className="relative" ref={menuRef}>
      <button
        className="flex items-center focus:outline-none"
        onClick={() => setProfileMenuOpen(!profileMenuOpen)}
      >
        <img
          src="/INVEXIS_WICON.png" // Replace with the actual path to the profile photo
          alt="Profile"
          className="h-9 w-9 rounded-full border-2 border-white"
        />
      </button>

      {/* Profile Menu */}
      {profileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10">
          <ul className="py-1">
            <li>
              <Link
                href="/profile" // Navigate to the profile page
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
              >
                <User className="h-5 w-5 mr-2" /> My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/settings"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
              >
                <Settings className="h-5 w-5 mr-2" /> Settings
              </Link>
            </li>
            <li>
              <Link
                href="/help"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
              >
                <HelpCircle className="h-5 w-5 mr-2" /> Help Centre
              </Link>
            </li>
            <li>
              <button
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
                onClick={toggleDarkMode}
              >
                {darkMode ? (
                  <>
                    <Sun className="h-5 w-5 mr-2" /> Light Mode
                  </>
                ) : (
                  <>
                    <Moon className="h-5 w-5 mr-2" /> Dark Mode
                  </>
                )}
              </button>
            </li>
            <li>
              <button
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
                onClick={handleLogout} // Call the logout function
              >
                <LogOut className="h-5 w-5 mr-2" /> Logout
              </button>
            </li>
          </ul>
        </div>
      )}
    </div>
  );
};

export default ProfileMenu;