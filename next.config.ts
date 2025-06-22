import type { NextConfig } from "next";
import path from "path";

const nextConfig: NextConfig = {
  // output: 'export', // Removed because it's incompatible with API routes
  // trailingSlash: true, // Removed for Netlify SSR
  images: {
    unoptimized: true
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "~": path.resolve(__dirname, "src"),
    };
    return config;
  },
  /* config options here */
};

export default nextConfig;
