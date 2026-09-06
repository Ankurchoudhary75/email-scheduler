import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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

