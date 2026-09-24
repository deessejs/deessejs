import type { NextConfig } from "next"
import createNextIntlPlugin from "next-intl/plugin"

// `createNextIntlPlugin` wires the i18n request config (ADR-031
// Decision #10) into the build. Without it, `getMessages()` throws
// "Couldn't find next-intl config file" at prerender time.
// The plugin's declared wrapper return type is `Promise<Partial<NextConfig>>`
// (a stale doc artefact — the actual runtime return is the synchronous
// `nextConfig` we pass in). We type the wrapper explicitly as a
// sync `(NextConfig) => NextConfig` so TypeScript doesn't propagate
// the Promise type into the export.
type NextConfigWrapper = (nextConfig: NextConfig) => NextConfig
const withNextIntl = createNextIntlPlugin(
  "./app/[locale]/i18n/request.ts",
) as unknown as NextConfigWrapper

const nextConfig: NextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/api",
    "@workspace/auth",
    "@workspace/utils",
    "@workspace/i18n",
    "@workspace/cookies",
  ],
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
}

export default withNextIntl(nextConfig)
