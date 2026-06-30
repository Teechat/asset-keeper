import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Prevent @line/bot-sdk (which uses node: URIs) from being bundled by webpack
  serverExternalPackages: ["@line/bot-sdk"],

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
