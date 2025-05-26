"use client";
import { Home, User, Settings, HelpCircle, Moon, Sun, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";

const Header = ({ title = "Inventory Management System" }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add logic to apply dark mode (e.g., toggling a CSS class or updating a context)
  };

  return (
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
      <div className=" mx-auto px-2 sm:px-4 py-2 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Link href="/">
            <img
              src="/INVEXIS102.svg" // Replace with the actual path to your logo
              alt="Logo"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>
        </div>

        {/* Title Section */}
        <div className="ml-10 absolute left-1/2 transform -translate-x sm:static sm:transform-none">
          <h1 className="text-lg sm:text-xl font-bold hidden sm:block">{title}</h1>
        </div>

        {/* Navigation Section */}
        <div className="flex items-center space-x-4">
          {/* Back to Dashboard Button */}
          <Link
            href="/"
            className="transition px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center sm:bg-blue-600 sm:hover:bg-blue-700"
          >
            <Home className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          {/* Profile Section */}
          <div className="relative">
            <button
              className="flex items-center focus:outline-none"
              onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            >
              <img
                src="/INVEXISLOGO.png" // Replace with the actual path to the profile photo
                alt="Profile"
                className="h-8 w-8 rounded-full border-2 border-white"
              />
            </button>

            {/* Profile Menu */}
            {profileMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10">
                <ul className="py-1">
                  <li>
                    <button
                      className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
                      onClick={() => console.log("My Profile clicked")}
                    >
                      <User className="h-5 w-5 mr-2" /> My Profile
                    </button>
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
                      onClick={() => console.log("Logout clicked")}
                    >
                      <LogOut className="h-5 w-5 mr-2" /> Logout
                    </button>
                  </li>
                </ul>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default Header;