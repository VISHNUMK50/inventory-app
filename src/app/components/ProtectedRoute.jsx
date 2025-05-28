"use client";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { auth } from "../../firebase";

const ProtectedRoute = ({ children }) => {
  const router = useRouter();

  useEffect(() => {
    const unsubscribe = auth.onAuthStateChanged((user) => {
      if (!user) {
        router.push("/"); // Redirect to login if not authenticated
      }
    });

    return () => unsubscribe();
  }, [router]);

  return <>{children}</>;
};

export default ProtectedRoute;