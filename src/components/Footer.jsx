"use client";
import { Package, Mail, Phone, Github } from "lucide-react";
import Link from "next/link";

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer
      style={{
        background: "linear-gradient(90deg, var(--accent), var(--indigo))",
        color: "var(--accent-foreground)",
      }}
    >
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
            <p className="mt-2" style={{ color: "var(--accent-foreground)", opacity: 0.8 }}>
              Simple and powerful inventory management solution for businesses of all sizes.
            </p>
          </div>
          <div className="hidden md:block">
            {/* Quick Links */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--accent-foreground)" }}>Quick Links</h3>
              <div className="grid grid-cols-2 gap-2">
                <Link href="/dashboard" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Dashboard
                </Link>
                <Link href="/inventory/manage-inventory" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Inventory
                </Link>
                <Link href="/reports" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Reports
                </Link>
                <Link href="/settings" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Settings
                </Link>
                <Link href="/help" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Help Center
                </Link>
                <Link href="/contact" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition">
                  Contact Us
                </Link>
              </div>
            </div>
          </div>
          <div className="hidden md:block">
            {/* Contact Info */}
            <div className="flex flex-col">
              <h3 className="text-lg font-semibold mb-2" style={{ color: "var(--accent-foreground)" }}>Contact</h3>
              <div className="space-y-2">
                <div className="flex items-center">
                  <Mail className="h-4 w-4 mr-2" style={{ color: "var(--accent-foreground)" }} />
                  <span className="text-sm" style={{ color: "var(--accent-foreground)", opacity: 0.8 }}>support@inventorypro.com</span>
                </div>
                <div className="flex items-center">
                  <Phone className="h-4 w-4 mr-2" style={{ color: "var(--accent-foreground)" }} />
                  <span className="text-sm" style={{ color: "var(--accent-foreground)", opacity: 0.8 }}>+1 (555) 123-4567</span>
                </div>
                <div className="flex items-center mt-4">
                  <Link href="https://github.com/inventorypro" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="hover:opacity-100 transition mr-4">
                    <Github className="h-5 w-5" />
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div
          className="mt-4 pt-4 flex justify-between items-center"
          style={{
            borderTop: "1px solid var(--border)",
            color: "var(--accent-foreground)",
            opacity: 0.8,
          }}
        >
          <p className="text-sm" style={{ color: "var(--accent-foreground)", opacity: 0.8 }}>
            &copy; {currentYear} InventoryPro. All rights reserved.
          </p>
          <div className="flex space-x-4">
            <Link href="/privacy" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="text-sm hover:opacity-100 transition">
              Privacy Policy
            </Link>
            <Link href="/terms" style={{ color: "var(--accent-foreground)", opacity: 0.8 }} className="text-sm hover:opacity-100 transition">
              Terms of Service
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;