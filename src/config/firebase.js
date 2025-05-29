import { initializeApp, getApps } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyClVfblc2vllt9HeJK2ewOdvUrc4BzDAJA",
  authDomain: "invexis-visid.firebaseapp.com",
  projectId: "invexis-visid",
  storageBucket: "invexis-visid.firebasestorage.app",
  messagingSenderId: "346653636739",
  appId: "1:346653636739:web:7867075bc4f390dd9643b6",
  measurementId: "G-LXM4PRLP54"
};

const app = !getApps().length ? initializeApp(firebaseConfig) : getApps()[0];

export const auth = getAuth(app);
export const db = getFirestore(app);