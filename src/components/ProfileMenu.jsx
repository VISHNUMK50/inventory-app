"use client";
import { useState, useEffect, useRef } from "react";
import { User, Settings, HelpCircle, Moon, Sun, FileChartColumnIncreasing, LogOut } from "lucide-react";
import Link from "next/link";
import { signOut } from "firebase/auth";
import { auth, db } from "../config/firebase";
import { doc, getDoc } from "firebase/firestore";
import avatar from "../../public/avatar.png"; // adjust path if needed
import { useRouter } from "next/navigation";

const ProfileMenu = ({ darkMode, toggleDarkMode, onLogout }) => {
  const router = useRouter();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const menuRef = useRef(null); // Reference to the menu container
  const [photoURL, setPhotoURL] = useState(avatar.src);

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docId = user.email.replace(/\./g, "_");
        const userDoc = await getDoc(doc(db, "users", docId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setPhotoURL(data.user?.photoURL || avatar.src);
        }
      }
    });
    return () => unsubscribe();
  }, []);

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
    // console.log("Logout clicked");
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
          src={photoURL}
          alt="Profile"
          className="h-9 w-9 rounded-full border-2 border-white object-cover object-center"
        />
      </button>

      {/* Profile Menu */}
      {profileMenuOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white text-black rounded-md shadow-lg z-10">
          <ul className="py-1">
            <li>
              <Link
                href="/profile"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
              >
                <User className="h-5 w-5 mr-2" /> My Profile
              </Link>
            </li>
            <li>
              <Link
                href="/reports"
                className="flex items-center px-4 py-2 w-full hover:bg-gray-100"
              >
                <FileChartColumnIncreasing className="h-5 w-5 mr-2" /> Reports
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
                onClick={handleLogout}
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