"use client";
import { useState } from "react";
import { createUserWithEmailAndPassword, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { auth } from "../../config/firebase";
import { getFirestore, doc, setDoc } from "firebase/firestore"; // Firestore imports
import Link from "next/link";
import { useRouter } from "next/navigation";
import githubConfig from "@/config/githubConfig"; // If you want to use defaults
import { db } from "@/config/firebase";
const db = getFirestore(); // Initialize Firestore

const SignupPage = () => {
  const [formData, setFormData] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const router = useRouter();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const user = userCredential.user;
      const userId = user.uid;
      const username = formData.email.split("@")[0];

      // Build initial GitHub config for this user
      const userGithubConfig = {
        token: "", // Empty by default
        repo: githubConfig.repo || "inv-db",
        owner: githubConfig.owner || "VISHNUMK50",
        branch: githubConfig.branch || "master",
        path: `${username}-${userId}/db`,
        datasheets: `${username}-${userId}/db/datasheets`
      };

      // Save user details to Firestore
      await setDoc(doc(db, "users", userId), {
        email: formData.email,
        userId: userId,
        createdAt: new Date().toISOString(),
        name: "", // You can add a name field if you want
        phone: "",
        address: "",
        company: "",
        position: "",
        githubConfig: userGithubConfig
      });

      alert("Account created successfully!");
      setError("");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error creating account:", err.message);
      setError(err.message);
    }
  };

  const handleGoogleSignUp = async () => {
    const provider = new GoogleAuthProvider();
    try {
      const result = await signInWithPopup(auth, provider);
      const user = result.user;
      const userId = user.uid;
      const username = user.email.split("@")[0];

      // Build initial GitHub config for this user
      const userGithubConfig = {
        token: "",
        repo: githubConfig.repo || "inv-db",
        owner: githubConfig.owner || "VISHNUMK50",
        branch: githubConfig.branch || "master",
        path: `${username}-${userId}/db`,
        datasheets: `${username}-${userId}/db/datasheets`
      };

      // Save user details to Firestore
      await setDoc(doc(db, "users", userId), {
        email: user.email,
        userId: userId,
        createdAt: new Date().toISOString(),
        name: user.displayName || "",
        phone: "",
        address: "",
        company: "",
        position: "",
        githubConfig: userGithubConfig
      });

      alert("Google Sign-Up successful!");
      setError("");
      router.push("/dashboard");
    } catch (err) {
      console.error("Error with Google Sign-Up:", err.message);
      setError(err.message);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md">
        <h1 className="text-2xl font-bold text-center mb-6">Sign Up</h1>
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
            <input
              type="email"
              id="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your email"
            />
          </div>
          <div className="mb-6">
            <label
              htmlFor="password"
              className="block text-sm font-medium text-gray-700 mb-1"
            >
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter your password"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition"
          >
            Sign Up
          </button>
        </form>
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-600">Or sign up with</p>
          <button
            onClick={handleGoogleSignUp}
            className="mt-2 w-full bg-gray-100 py-2 font-semibold rounded-md hover:bg-gray-200 transition flex items-center justify-center"
          >
            <img
              src="/google-icon.svg" // Replace with the path to your Google icon
              alt="Google"
              className="h-5 w-5 mr-2"
            />
            Sign Up with Google
          </button>
        </div>
        <p className="text-center mt-4">
          Already have an account?{" "}
          <Link href="/" className="text-blue-600 hover:underline">
            Login
          </Link>
        </p>
      </div>
    </div>
  );
};

export default SignupPage;