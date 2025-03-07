import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  env: {
    NEXT_PUBLIC_DATABASE_PAT: process.env.NEXT_PUBLIC_DATABASE_PAT,
  },
  // Your other config options remain here
};

export default nextConfig;