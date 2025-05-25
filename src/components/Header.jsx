"use client";
import { Package, Home } from "lucide-react";
import Link from "next/link";

const Header = ({ title = "Inventory Management System" }) => {
  return (
    <header className="main-header bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
      <div className="mx-auto py-2 px-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Link href="/">
              <img
                src="/INVEXIS102.svg"
                alt="Logo"
                className="h-12"

              />
            </Link>
          </div>
          <h2 className="ml-60 text-3xl font-bold">{title}</h2>
          <div className="flex items-center">
            <Link
              href="/"
              className="bg-blue-600 hover:bg-blue-700 transition px-4 py-2 rounded-md mr-4 flex items-center"
            >
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
  );
};

export default Header;
