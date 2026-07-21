import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // output: "standalone", // disabled for Render (uses next start instead)
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
};

export default nextConfig;