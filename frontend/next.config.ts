import type { NextConfig } from "next";

// Optional same-origin API proxy. When set (e.g. https://tutormatching-api.onrender.com),
// /api/v1/* and /uploads/* are forwarded to the backend so the browser sees one site and
// the SameSite=Lax auth/CSRF cookies work. Pair with NEXT_PUBLIC_API_BASE_URL=/api/v1.
const apiProxyTarget = process.env.API_PROXY_TARGET?.trim().replace(/\/+$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!apiProxyTarget) return [];
    return [
      { source: "/api/v1/:path*", destination: `${apiProxyTarget}/api/v1/:path*` },
      { source: "/uploads/:path*", destination: `${apiProxyTarget}/uploads/:path*` },
    ];
  },
  /* config options here */
  reactCompiler: true,
  distDir: process.env.ISOLATED_E2E === "1" ? ".next-e2e" : ".next",
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
      {
        protocol: "https",
        hostname: "res.cloudinary.com",
      },
      {
        // Google account profile pictures used as avatars for Google sign-ups.
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
