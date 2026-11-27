import type { NextConfig } from "next";

/**
 * Response headers applied to every route. A strict Content-Security-Policy is
 * deliberately not set yet: it needs nonces for Next's inline scripts and would
 * break the app if misconfigured — tracked as a follow-up.
 */
const securityHeaders = [
  // Forbid embedding the app in another site (clickjacking).
  { key: "X-Frame-Options", value: "DENY" },
  // Browsers must not guess content types.
  { key: "X-Content-Type-Options", value: "nosniff" },
  // Do not leak full URLs to other sites.
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Only HTTPS, for two years, subdomains included.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
  // Features the app does not use stay off.
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), payment=()",
  },
];

const nextConfig: NextConfig = {
  // Image optimization - enable WebP and AVIF formats
  images: {
    formats: ["image/avif", "image/webp"],
  },

  // Disable source maps in production (reduce bundle size, hide source)
  productionBrowserSourceMaps: false,

  // React strict mode (dev only, helps catch issues)
  reactStrictMode: true,

  // Do not advertise the framework in a response header.
  poweredByHeader: false,

  async headers() {
    return [{ source: "/(.*)", headers: securityHeaders }];
  },
};

export default nextConfig;
