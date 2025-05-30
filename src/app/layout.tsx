import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";
import Header from "@/components/Header";

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
    <body className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}>
      <Header />
      <main className="flex-grow">
        {children}
      </main>
      <Footer />
    </body>
  </html>
);
}
