"use client";
import { Home, User, Settings, HelpCircle, Moon, Sun, LogOut } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import ProfileMenu from "@/components/ProfileMenu";


const Header = ({ title = "Inventory Management System" }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);

  const toggleDarkMode = () => {
    setDarkMode(!darkMode);
    // Add logic to apply dark mode (e.g., toggling a CSS class or updating a context)
  };
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
    <header className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
      <div className=" mx-auto px-2 sm:px-4 py-2 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <img
              src="/INVEXIS_LOGO1020.png" // Replace with the actual path to your logo
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
            href="/dashboard"
            className="transition px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center sm:bg-blue-600 sm:hover:bg-blue-700"
          >
            <Home className="h-5 w-5 sm:mr-2" />
            <span className="hidden sm:inline">Back to Dashboard</span>
          </Link>

          {/* Profile Section */}
          <ProfileMenu
            darkMode={darkMode}
            toggleDarkMode={toggleDarkMode}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;