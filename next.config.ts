import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  typescript: {
    ignoreBuildErrors: true,
  },
  reactStrictMode: false,
  // Include Prisma client in standalone output
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
};

export default nextConfig;