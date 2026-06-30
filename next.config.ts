import type { NextConfig } from "next";
import packageJson from "./package.json";

const nextConfig: NextConfig = {
  /* config options here */
  // reactStrictMode: false,
  env: {
    NEXT_PUBLIC_APP_VERSION: packageJson.version,
  },
  images: {
    domains: ["storage.youngposse.kr"],
    formats: ["image/avif", "image/webp"],
  },
};

export default nextConfig;
