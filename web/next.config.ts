import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    // Car photos come from Wikimedia Commons, which allows linking to its files.
    remotePatterns: [new URL("https://upload.wikimedia.org/wikipedia/commons/**")],
    // A Commons file never changes at the same address, so resized copies can be kept for a month.
    minimumCacheTTL: 2678400,
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
