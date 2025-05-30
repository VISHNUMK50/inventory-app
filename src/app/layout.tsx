import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Invexis",
  icons: {
    icon: "/INVEXIS_WICON.ico",
    apple: "/INVEXIS_BICON.png",
    shortcut: "/INVEXIS_WICON.png",  // FEVICON
  },
  description: "THE INVENTORY MANAGEMENT SYSTEM FOR YOUR BUSINESS",
};
export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5, // Changed from 1 to 5 for better accessibility
  minimumScale: 1,
  userScalable: true, // Changed to true for better accessibility
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="manifest" href="/manifest.json" />
        <link rel="icon" href="/INVEXIS_WICON.ico" />
        <link rel="apple-touch-icon" href="/INVEXIS_BICON.png" />
        <meta name="theme-color" content="#1E40AF" /> {/* Status bar color */}
        <meta name="msapplication-navbutton-color" content="#1D4ED8" /> {/* Windows Phone */}
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
        <main className="flex-grow">
          {children}
        </main>
        <Footer />
      </body>
    </html>
  );
}
