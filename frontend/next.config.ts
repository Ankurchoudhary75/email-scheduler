import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: [
    "pushing-hash-scotia-consortium.trycloudflare.com",
    "*.trycloudflare.com",
    "localhost:3000",
    "127.0.0.1:3000",
  ],
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: "http://localhost:4000/api/:path*",
      },
      {
        source: "/admin/queues/:path*",
        destination: "http://localhost:4000/admin/queues/:path*",
      },
    ];
  },
};

export default nextConfig;


