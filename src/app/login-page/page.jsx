"use client";
import { useState, useEffect } from "react";
import { Lock, User } from "lucide-react";
import { signInWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../config/firebase";
import Link from "next/link";
import { useRouter } from "next/navigation";

const LoginPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [username, setUsername] = useState("");
  const [uid, setUid] = useState("");
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const email = currentUser.email;
        const extractedUsername = email.split("@")[0]; // Extract username from email
        setUsername(extractedUsername);
        setUid(currentUser.uid);

        // Store username and uid in local storage
        localStorage.setItem("username", extractedUsername);
        localStorage.setItem("uid", currentUser.uid);

        // Define and store githubConfig in local storage
        const githubConfig = {
          token: process.env.NEXT_PUBLIC_DATABASE_PAT || '',
          repo: process.env.GITHUB_REPO || "inv-db",
          owner: process.env.GITHUB_OWNER || "VISHNUMK50",
          branch: "master",
          path: `${extractedUsername}-${currentUser.uid}/db`, // Dynamically set the path
          datasheets: `${extractedUsername}-${currentUser.uid}/db/datasheets`, // Dynamically set the datasheets path
        };
        localStorage.setItem("githubConfig", JSON.stringify(githubConfig));
      }
    });

    return () => unsubscribe(); // Cleanup the listener
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await signInWithEmailAndPassword(auth, formData.email, formData.password);
      // alert("Login successful!");
      setError(""); // Clear any previous error
      router.push("/dashboard"); // Redirect to the dashboard
    } catch (err) {
      setError("Invalid email or password."); // Set error message if login fails
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      // alert("Google Sign-In successful!");
      setError(""); // Clear any previous error
      router.push("/dashboard"); // Redirect to the dashboard
    } catch (err) {
      console.error("Error with Google Sign-In:", err.message); // Log the error
      setError(err.message); // Display the exact error message
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Login</h1>
        {error && (
          <div className="mb-4 text-red-600 text-sm text-center">{error}</div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label
              htmlFor="email"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Email
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your email"
              />
            </div>
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 text-gray-400" />
              <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full pl-10 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="Enter your password"
              />
            </div>
          </div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 font-semibold rounded-md hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Or sign in with</p>
          <button
            onClick={handleGoogleSignIn}
            className="mt-2 w-full bg-gray-100 py-2 font-semibold rounded-md hover:bg-gray-200 transition flex items-center justify-center"
          >
            <img
              src="/google-icon.svg"
              alt="Google"
              className="h-5 w-5 mr-2"
            />
            Sign In with Google
          </button>
        </div>
        <p className="text-center mt-4">
          Don't have an account?{" "}
          <Link href="/signup-page" className="text-blue-600 hover:underline">
            Sign Up
          </Link>
        </p>
      </div>
    </div>
  );
};

export default LoginPage;