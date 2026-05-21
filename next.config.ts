import type { NextConfig } from "next";

const nextConfig: NextConfig = {
 images: {
    domains: ["images.unsplash.com", "ik.imagekit.io","lh3.googleusercontent.com"],
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31536000,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      }, {
        protocol: "https",
        hostname: "lh3.googleusercontent.com",
      },
    ],
  },
};

export default nextConfig;
