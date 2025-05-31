"use client";
import { Home } from "lucide-react";
import Link from "next/link";
import { useState, useEffect } from "react";
import ProfileMenu from "@/components/ProfileMenu";
import { usePathname } from "next/navigation";
import { auth, db } from "@/config/firebase"; // Make sure these are correctly imported
import { doc, getDoc } from "firebase/firestore";

const Header = ({ title = "Inventory Management System", hide = false }) => {
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);
  const [darkMode, setDarkMode] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged(async (user) => {
      if (user) {
        const docId = user.email.replace(/\./g, "_");
        const userDoc = await getDoc(doc(db, "users", docId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setDisplayName(data.user?.displayName || "");
        }
      }
    });
    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    // Optionally persist preference
    localStorage.setItem('darkMode', darkMode ? '1' : '0');
  }, [darkMode]);

  useEffect(() => {
    // On mount, read preference
    const saved = localStorage.getItem('darkMode');
    if (saved === '1') setDarkMode(true);
  }, [])

  const handleLogout = () => {
    auth.signOut()
      .then(() => {
        localStorage.clear();
        router.push('/');
      })
      .catch((error) => {
        console.error("Error signing out:", error);
      });
  };

  if (hide) return null;

    return (
    <header
      style={{
        background: "linear-gradient(90deg, var(--accent), var(--indigo))",
        color: "var(--accent-foreground)",
      }}
    >
      <div className="mx-auto px-2 sm:px-4 py-2 flex items-center justify-between">
        {/* Logo Section */}
        <div className="flex items-center space-x-2">
          <Link href="/dashboard">
            <img
              src="/INVEXIS_LOGO1020.png"
              alt="Logo"
              className="h-8 sm:h-10 w-auto"
            />
          </Link>
        </div>
  
        {/* Title Section */}
        <div className="ml-10 absolute left-1/2 transform -translate-x sm:static sm:transform-none">
          <h1
            className="text-lg sm:text-xl font-bold hidden sm:block"
            style={{ color: "var(--accent-foreground)" }}
          >
            {title}
          </h1>
        </div>
  
        {/* Navigation Section */}
        <div className="flex items-center space-x-4">
          {pathname !== "/dashboard" ? (
            <Link
              href="/dashboard"
              className="transition px-3 py-1.5 sm:px-4 sm:py-2 rounded-md flex items-center"
              style={{
                background: "var(--accent)",
                color: "var(--accent-foreground)",
              }}
              onMouseOver={e => (e.currentTarget.style.background = "var(--indigo)")}
              onMouseOut={e => (e.currentTarget.style.background = "var(--accent)")}
            >
              <Home className="h-5 w-5 sm:mr-2" />
              <span className="hidden sm:inline">Back to Dashboard</span>
            </Link>
          ) : (
            <span
              className="font-semibold px-3 py-1.5"
              style={{ color: "var(--accent-foreground)" }}
            >
              Welcome, {displayName}
            </span>
          )}
          <ProfileMenu
            darkMode={darkMode}
            toggleDarkMode={() => setDarkMode((dm) => !dm)}
            onLogout={handleLogout}
          />
        </div>
      </div>
    </header>
  );
};

export default Header;