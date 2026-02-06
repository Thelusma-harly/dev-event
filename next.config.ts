import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "1vfjjjrc00.ucarecd.net",
        pathname: "/**",
      },
    ],
    loader: "custom",
    loaderFile: "lib/uploadcareLoader.ts",
  },
};

export default nextConfig;
