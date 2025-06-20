import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: 'export', // Removed because it's incompatible with API routes
  // trailingSlash: true, // Removed for Netlify SSR
  images: {
    unoptimized: true
  },
  /* config options here */
};

export default nextConfig;
