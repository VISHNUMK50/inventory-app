"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../config/firebase"; // Adjust the path to your firebase.js file
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

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const router = useRouter();

  useEffect(() => {
    const excludedRoutes = ["/", "/signup-page"]; // Add routes to exclude
    if (excludedRoutes.includes(router.pathname)) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

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
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased flex flex-col min-h-screen`}
      >
        <main className="flex-grow">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
