import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: { ignoreBuildErrors: true },
  eslint: { ignoreDuringBuilds: true },

  webpack(config, { isServer }) {
    const nodeBuiltins = [
      "buffer", "stream", "crypto", "path", "os", "fs", "net", "tls",
      "events", "util", "url", "http", "https", "zlib", "assert",
      "querystring", "process", "string_decoder",
    ];
    for (const mod of nodeBuiltins) {
      config.resolve.alias = { ...config.resolve.alias, [`node:${mod}`]: mod };
    }
    if (!isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        buffer: false, stream: false, crypto: false,
        net: false, tls: false, fs: false, os: false,
        path: false, http: false, https: false, zlib: false,
        string_decoder: false, assert: false, querystring: false,
      };
    }
    return config;
  },

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
