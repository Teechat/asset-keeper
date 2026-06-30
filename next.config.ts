import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow LIFF SDK to be loaded from LINE's CDN
  async headers() {
    return [
      {
        source: "/dashboard/:path*",
        headers: [
          { key: "X-Frame-Options", value: "ALLOWALL" },
          { key: "Content-Security-Policy", value: "frame-ancestors *" },
        ],
      },
    ];
  },
};

export default nextConfig;
