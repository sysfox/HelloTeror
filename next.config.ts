import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    domains: [
      "github.com",
      "raw.githubusercontent.com",
      "avatars.githubusercontent.com",
    ],
  },
  output: "standalone",
};

export default nextConfig;
