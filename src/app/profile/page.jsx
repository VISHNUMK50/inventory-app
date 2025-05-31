"use client";
import { useState, useEffect, useRef } from "react";
import { Save, Upload, Camera } from "lucide-react";
import { doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "@/config/firebase";
import githubConfig from "@/config/githubConfig";
import Image from "next/image";
import { useRouter } from "next/navigation";
import jsPDF from "jspdf";
import avatar from "../../../public/avatar.png"; // Make sure avatar.png exists in public folder
import { onAuthStateChanged } from "firebase/auth";

// Utility to base64 encode UTF-8 strings for GitHub API
function encodeContent(content) {
  if (typeof window === "undefined") return Buffer.from(content).toString("base64");
  return window.btoa(unescape(encodeURIComponent(content)));
}

// Save or update a file in GitHub repo
async function saveFileToGithub({ token, repo, owner, branch, filePath, content, commitMessage }) {
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}/contents/${filePath}`;
  let sha;
  // Check if file exists to get sha
  const getRes = await fetch(apiUrl, {
    headers: { Authorization: `token ${token}` }
  });
  if (getRes.ok) {
    const data = await getRes.json();
    sha = data.sha;
  }
  // Save or create file
  const res = await fetch(apiUrl, {
    method: "PUT",
    headers: {
      Authorization: `token ${token}`,
      "Content-Type": "application/json"
    },
    body: JSON.stringify({
      message: commitMessage,
      content: encodeContent(content),
      branch,
      ...(sha ? { sha } : {})
    })
  });
  if (!res.ok) throw new Error(`GitHub save failed: ${res.status}`);
}
function generateProfilePDF(profile) {
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text("User Profile", 10, 15);
  doc.setFontSize(12);
  let y = 30;
  Object.entries(profile).forEach(([key, value]) => {
    doc.text(`${key}: ${value ?? ""}`, 10, y);
    y += 10;
  });
  return doc.output("datauristring"); // returns a data URI string
}
const ProfilePage = () => {
  const router = useRouter();
  const fileInputRef = useRef(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    company: "",
    position: "Manager",
  });
  const [userId, setUserId] = useState("");
  const [githubPath, setGithubPath] = useState("");
  const [config, setConfig] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [isUploading, setIsUploading] = useState(false);



  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  // Fetch profile data from Firestore when the component mounts
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setConfig(githubConfig);
        const uid = currentUser.uid;
        const email = currentUser.email;
        const username = email.split("@")[0];
        setUserId(uid);
        setGithubPath(`${username}-${uid}/db`);
        const docId = email.replace(/\./g, "_");
        try {
          const userDoc = await getDoc(doc(db, "users", docId));
          if (userDoc.exists()) {
            const data = userDoc.data();
            const userData = data.user || {};
            setFormData({
              name: userData.displayName || username,
              email: userData.email || email,
              phone: userData.phone || "",
              address: userData.address || "",
              company: userData.company || "",
              position: userData.position || "Manager",
            });
            setPhotoPreview(userData.photoURL || avatar.src);
          } else {
            setFormData({
              name: username,
              email: email,
              phone: "",
              address: "",
              company: "",
              position: "Manager",
            });
            setPhotoPreview(avatar.src);
          }
        } catch (err) {
          console.error("Firestore getDoc error:", err);
          // Optionally set default state here
        }
      }
    });
    return () => unsubscribe();
  }, []);

  const handlePhotoClick = () => {
    fileInputRef.current?.click();
  };

  const handlePhotoChange = async (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setIsUploading(true);
      const reader = new FileReader();
      reader.onloadend = async () => {
        setPhotoPreview(reader.result);

        try {
          // Save photo to GitHub images folder with displayName as filename
          if (config && config.token && config.repo && config.owner && githubPath && formData.name) {
            const { token, repo, owner, branch } = config;
            // Extract file extension
            const ext = file.name.split('.').pop() || "jpg";
            // Sanitize displayName for filename
            const safeName = formData.name.replace(/[^a-z0-9_\-]/gi, "_");
            const filePath = `${githubPath}/images/${safeName}.${ext}`;

            // Convert base64 data URL to base64 string (remove prefix)
            const base64Data = reader.result.split(",")[1];

            await saveFileToGithub({
              token,
              repo,
              owner,
              branch,
              filePath,
              content: base64Data,
              commitMessage: `Upload profile photo for ${formData.name}`,
            });

            // Set the GitHub raw URL as the photo URL
            const photoUrl = `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${filePath}`;
            setFormData(prev => ({ ...prev, photoURL: photoUrl }));
          }
        } catch (error) {
          console.error("Error uploading photo to GitHub:", error);
        } finally {
          setIsUploading(false);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    try {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        alert("User not authenticated");
        return;
      }
      const docId = currentUser.email.replace(/\./g, "_");
      await setDoc(doc(db, "users", docId), {
        user: {
          uid: userId,
          email: currentUser.email,
          displayName: formData.name,
          photoURL: photoPreview || avatar.src,
          phone: formData.phone,
          address: formData.address,
          company: formData.company,
          position: formData.position,
        }
      }, { merge: true });

      // --- Save to GitHub ---
      if (config && config.token && config.repo && config.owner && githubPath) {
        const { token, repo, owner, branch } = config;

        // 1. Save profile.json
        await saveFileToGithub({
          token, repo, owner, branch,
          filePath: `${githubPath}/profile/profile.json`,
          content: JSON.stringify({
            name: formData.name,
            email: formData.email,
            phone: formData.phone,
            address: formData.address,
            company: formData.company,
            position: formData.position,
            photoURL: photoPreview || "",
            uid: userId
          }, null, 2),
          commitMessage: "Update profile.json"
        });

        // --- Save profile as PDF in /datasheets ---
        const pdfDataUri = generateProfilePDF({
          name: formData.name,
          email: formData.email,
          phone: formData.phone,
          address: formData.address,
          company: formData.company,
          position: formData.position,
          uid: userId
        });
        // Extract base64 from data URI
        const pdfBase64 = pdfDataUri.split(",")[1];
        await saveFileToGithub({
          token, repo, owner, branch,
          filePath: `${githubPath}/datasheets/profile.pdf`,
          content: pdfBase64,
          commitMessage: "Save profile as PDF"
        });
        // --- End PDF save ---

        // ...existing code for dropdownOptions, lastUsedId, dummy product...
        await saveFileToGithub({
          token, repo, owner, branch,
          filePath: `${githubPath}/dropdownOptions.json`,
          content: JSON.stringify({
            partNames: [],
            manufacturers: [],
            vendors: [],
            manufacturerParts: [],
            categories: []
          }, null, 2),
          commitMessage: "Init dropdownOptions.json"
        });

        await saveFileToGithub({
          token, repo, owner, branch,
          filePath: `${githubPath}/lastUsedId.json`,
          content: JSON.stringify({ lastUsedId: 1000 }, null, 2),
          commitMessage: "Init lastUsedId.json"
        });

        await saveFileToGithub({
          token, repo, owner, branch,
          filePath: `${githubPath}/jsons/1000-1000-1000.json`,
          content: JSON.stringify({
            id: "1000",
            partName: "1000",
            createdAt: new Date().toISOString(),
            manufacturer: "1000",
            manufacturerPart: "1000",
            vendor: "1000",
            vendorProductLink: "",
            image: "",
            imageData: "",
            imageType: "",
            datasheet: "",
            datasheetData: "",
            datasheetType: "",
            avl_quantity: "0",
            binLocations: [],
            customerRef: "",
            description: "dummy product - please delete if you want to.",
            reorderPoint: "",
            reorderQty: "",
            costPrice: "",
            salePrice: "",
            category: ""
          }, null, 2),
          commitMessage: "Add dummy product 1000-1000-1000.json"
        });
      }
      // --- End Save to GitHub ---

      // alert("Profile updated successfully!");
      router.push("/dashboard");
    } catch (error) {
      console.error("Error saving profile:", error);
      alert("Failed to update profile");
    }
  };

  return (
    <div className="mx-auto bg-card shadow-xl overflow-hidden min-h-screen transition-colors duration-200">
      <div className="flex flex-col items-center w-full gap-6">
        <div className="bg-card rounded-2xl shadow-2xl w-full max-w-4xl p-8 flex flex-col items-center transition-colors duration-200">
          {/* Profile Photo Section */}
          <div className="relative mb-6">
            <div
              className="w-36 h-36 rounded-full border-4 border-blue-200 dark:border-blue-800 shadow-lg overflow-hidden flex items-center justify-center bg-background cursor-pointer hover:opacity-90 transition"
              onClick={handlePhotoClick}
            >
              {photoPreview ? (
                <Image
                  src={photoPreview}
                  alt="Profile"
                  width={144}
                  height={144}
                  className="object-cover object-center w-full h-full"
                />
              ) : (
                <Camera className="h-16 w-16 text-blue-300 dark:text-blue-700" />
              )}
            </div>
            <input
              type="file"
              ref={fileInputRef}
              className="hidden"
              accept="image/*"
              onChange={handlePhotoChange}
            />
            {isUploading && (
              <div className="absolute inset-0 bg-black bg-opacity-40 rounded-full flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-t-2 border-white"></div>
              </div>
            )}
            <button
              type="button"
              onClick={handlePhotoClick}
              className="absolute bottom-2 right-2 bg-accent text-accent-foreground rounded-full p-2 shadow hover:bg-blue-700 transition"
              title="Change Photo"
            >
              <Upload className="h-5 w-5" />
            </button>
          </div>
          {/* Profile Info */}
          <form className="w-full space-y-4" onSubmit={handleSave}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">User ID</label>
                <input
                  type="text"
                  value={userId}
                  readOnly
                  onFocus={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-border rounded bg-section-gray dark:bg-section-gray text-gray-500 dark:text-gray-400"
                />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 mb-1">GitHub Path</label>
                <input
                  type="text"
                  value={githubPath}
                  readOnly
                  onFocus={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-border rounded bg-section-gray dark:bg-section-gray text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border bg-background rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  readOnly
                  onFocus={(e) => e.target.blur()}
                  className="w-full px-3 py-2 border border-border rounded bg-section-gray dark:bg-section-gray text-gray-500 dark:text-gray-400"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border bg-background rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Company</label>
                <input
                  type="text"
                  name="company"
                  value={formData.company}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border bg-background rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Position</label>
                <input
                  type="text"
                  name="position"
                  value={formData.position}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border bg-background rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1">Address</label>
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 border border-border bg-background rounded focus:outline-none focus:ring-2 focus:ring-blue-400 text-foreground"
                />
              </div>
            </div>
            <div className="pt-6">
              <button
                type="submit"
                className="flex items-center justify-center w-full px-4 py-3 
                bg-gray-700 dark:bg-red-800 
                text-gray-100 dark:text-red-200 
                rounded-lg font-semibold text-lg shadow 
                hover:bg-blue-700 hover:text-white transition"
              >
                <Save className="h-5 w-5 mr-2" />
                Save Changes
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ProfilePage;