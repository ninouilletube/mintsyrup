import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**.vinted.net' },
      { protocol: 'https', hostname: '**.vinted.fr' },
      { protocol: 'https', hostname: '**.vinted.pt' },
      { protocol: 'https', hostname: '**.vinted.com' },
    ],
  },
};

export default nextConfig;
