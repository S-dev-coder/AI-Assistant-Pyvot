import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // LLM-backed answers can take 30-90s; the default proxy timeout (30s) kills them
  experimental: {
    proxyTimeout: 180_000,
  },
  async rewrites() {
    return [
      {
        source: "/api/backend/:path*",
        destination: "http://127.0.0.1:5050/api/:path*",
      },
    ]
  },
}

export default nextConfig
