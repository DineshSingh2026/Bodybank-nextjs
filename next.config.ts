import type { NextConfig } from "next";

const legacy = (process.env.LEGACY_ORIGIN || "").replace(/\/$/, "");

const nextConfig: NextConfig = {
  async rewrites() {
    if (!legacy) return [];
    return [
      { source: "/api/:path*", destination: `${legacy}/api/:path*` },
      { source: "/uploads/:path*", destination: `${legacy}/uploads/:path*` },
    ];
  },
};

export default nextConfig;
