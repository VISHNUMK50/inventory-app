import { NextResponse } from "next/server";
import admin from "@/config/firebaseAdmin"; // Import Firebase Admin SDK
import githubConfig from "@/config/githubConfig"; // Import the GitHub config function

export async function GET(req) {
  try {
    // Get the Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return NextResponse.json(
        { error: "Unauthorized: Missing or invalid token." },
        { status: 401 }
      );
    }

    const token = authHeader.split("Bearer ")[1];

    // Verify the Firebase token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const email = decodedToken.email;
    const username = email.split("@")[0]; // Extract username from email
    const uid = decodedToken.uid;

    // Generate the GitHub configuration
    const config = githubConfig(username, uid);

    return NextResponse.json(config, { status: 200 });
  } catch (error) {
    console.error("Error generating GitHub config:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}