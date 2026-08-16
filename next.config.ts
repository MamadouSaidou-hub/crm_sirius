import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Image optimization - enable WebP and AVIF formats
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Disable source maps in production (reduce bundle size)
  productionBrowserSourceMaps: false,

  // React strict mode (dev only, helps catch issues)
  reactStrictMode: true,

  // Turbopack optimizations for faster builds
  // (already enabled by default in Next.js 16)
};

export default nextConfig;
