import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // shiki is ESM-only — let Next bundle it as an external on the server
  // so Turbopack/Webpack don't try to resolve its WASM-oniguruma imports
  // and fail with "Module not found" mid-HMR.
  serverExternalPackages: ["shiki"],

  // Permit HMR from 127.0.0.1 (Next 16 blocks cross-origin dev resources by default)
  allowedDevOrigins: ["127.0.0.1", "localhost"],

  transpilePackages: ["@workspace/ui", "tw-animate-css"],
};

export default nextConfig;
