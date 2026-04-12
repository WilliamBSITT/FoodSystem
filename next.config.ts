import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    formats: ["image/avif", "image/webp"],
    qualities: [68, 70, 75, 78, 90],
    minimumCacheTTL: 60 * 60 * 24 * 7,
  },
};

export default nextConfig;