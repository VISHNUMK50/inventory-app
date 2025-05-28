"use client";
import { Package, Mail, Phone, Github } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gradient-to-r from-blue-700 to-indigo-800 text-white">
      <div className="mx-auto py-4 px-2 sm:px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Company Info */}
          <div className="flex flex-col">
            <div className="flex items-center space-x-2">
              <img
                src="/INVEXIS_LOGO1020.png"
                alt="Logo"
                className="h-8"
              />
            </div>
            <p className="mt-2  text-gray-200">
              Simple and powerful inventory management solution for businesses of all sizes.
            </p>
          </div>
          <div className="hidden md:block">
          {/* Quick Links */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Quick Links</h3>
            <div className="grid grid-cols-2 gap-2">
              <Link href="/dashboard" className="text-gray-200 hover:text-white transition">
                Dashboard
              </Link>
              <Link href="/manage-inventory" className="text-gray-200 hover:text-white transition">
                Inventory
              </Link>
              <Link href="/reports" className="text-gray-200 hover:text-white transition">
                Reports
              </Link>
              <Link href="/settings" className="text-gray-200 hover:text-white transition">
                Settings
              </Link>
              <Link href="/help" className="text-gray-200 hover:text-white transition">
                Help Center
              </Link>
              <Link href="/contact" className="text-gray-200 hover:text-white transition">
                Contact Us
              </Link>
            </div>
          </div>
</div>          <div className="hidden md:block">

          {/* Contact Info */}
          <div className="flex flex-col">
            <h3 className="text-lg font-semibold mb-2">Contact</h3>
            <div className="space-y-2">
              <div className="flex items-center">
                <Mail className="h-4 w-4 mr-2" />
                <span className="text-sm">support@inventorypro.com</span>
              </div>
              <div className="flex items-center">
                <Phone className="h-4 w-4 mr-2" />
                <span className="text-sm">+1 (555) 123-4567</span>
              </div>
              <div className="flex items-center mt-4">
                <Link href="https://github.com/inventorypro" className="text-gray-200 hover:text-white transition mr-4">
                  <Github className="h-5 w-5" />
                </Link>
              </div>
            </div>
          </div>
</div>


        </div>

        <div className="border-t border-blue-600 mt-4 pt-4 flex justify-between items-center">
          <p className="text-sm text-gray-200">
            &copy; {currentYear} InventoryPro. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/privacy" className="text-sm text-gray-200 hover:text-white transition">
              Privacy Policy
            </Link>
            <Link href="/terms" className="text-sm text-gray-200 hover:text-white transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;