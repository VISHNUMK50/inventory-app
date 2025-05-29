import { auth } from "./firebase"; // Adjust the path to your Firebase configuration

// Updated githubConfig to accept username and uid as parameters
const githubConfig = (username, uid) => ({
  token: process.env.NEXT_PUBLIC_DATABASE_PAT || '',
  repo: process.env.GITHUB_REPO || "inv-db",
  owner: process.env.GITHUB_OWNER || "VISHNUMK50",
  branch: "master",
  path: `${username}-${uid}/db`, // Dynamically set the path
  datasheets: `${username}-${uid}/db/datasheets`, // Dynamically set the datasheets path
});

// Function to fetch username and uid from Firebase
export const fetchGithubConfig = async () => {
  return new Promise((resolve, reject) => {
    auth.onAuthStateChanged((currentUser) => {
      if (currentUser) {
        const email = currentUser.email;
        const username = email.split("@")[0]; // Extract username from email
        const uid = currentUser.uid;
console.log("Current User:", currentUser); // Log the current user for debugging
console.log("Username:", username); // Log the extracted username
        resolve({ username, uid }); // Resolve with username and uid
      } else {
        reject(new Error("No authenticated user found"));
      }
    });
  });
};

// Wrapper function to fetch the GitHub config after fetching username and uid
export const getGithubConfig = async () => {
  try {
    const { username, uid } = await fetchGithubConfig(); // Wait for username and uid
    return githubConfig(username, uid); // Pass them to githubConfig
  } catch (error) {
    console.error("Error fetching GitHub config:", error);
    throw error;
  }
};

export default githubConfig;