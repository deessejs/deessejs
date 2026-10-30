import type { NextConfig } from "next";
import { API_BASE_PATH } from "@workspace/api/base-path";

const nextConfig: NextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/schema/project/v1.json",
          destination: `${API_BASE_PATH}/schema/project/v1.json`,
        },
        {
          source: "/api/internal/avatars/cleanup",
          destination: `${API_BASE_PATH}/internal/avatars/cleanup`,
        },
      ],
    }
  },
  transpilePackages: ["@workspace/ui", "@workspace/api", "@workspace/auth", "@workspace/utils"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "vercel.com",
        pathname: "/api/www/avatar",
      },
    ],
    // Vercel's avatar endpoint returns SVG. The remotePatterns allowlist
    // already restricts to vercel.com/api/www/avatar, so this is safe.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // On networks where DNS64/NAT64 resolves external hostnames to private
    // IPv6 ranges (e.g. 64:ff9b::/96), Next.js's SSRF guard incorrectly
    // rejects the optimization request. Since remotePatterns is already
    // locked to vercel.com/api/www/avatar, allowing local-IP resolution
    // is safe.
    dangerouslyAllowLocalIP: true,
  },
};

export default nextConfig;
