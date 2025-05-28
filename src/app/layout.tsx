"use client";
import { useEffect, useState, createContext } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../config/firebase"; // Adjust the path to your firebase.js file
import githubConfig from "../config/githubConfig"; // Import githubConfig
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import Footer from "@/components/Footer";

// Create a context for GitHub config
export const GitHubConfigContext = createContext(null);

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
  const [githubConfigState, setGitHubConfigState] = useState(null);

  useEffect(() => {
    const excludedRoutes = ["/", "/signup-page"]; // Add routes to exclude
    if (excludedRoutes.includes(router.pathname)) return;

    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/"); // Redirect to login if not authenticated
      } else {
        const email = user.email;
        const extractedUsername = email.split("@")[0]; // Extract username from email
        const uid = user.uid;

        // Initialize GitHub config
        const config = githubConfig(extractedUsername, uid);
        console.log("Initialized GitHub Config:", config);

        // Save to state
        setGitHubConfigState(config);
      }
    });

    return () => unsubscribe();
  }, [router]);

  return (
    <GitHubConfigContext.Provider value={githubConfigState}>
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
    </GitHubConfigContext.Provider>
  );
}
