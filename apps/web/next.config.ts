import type { NextConfig } from "next"
import { withContentCollections } from "@content-collections/next"
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
  "./src/app/[locale]/i18n/request.ts",
) as unknown as NextConfigWrapper

const nextConfig: NextConfig = {
  transpilePackages: [
    "@workspace/ui",
    "@workspace/i18n",
    "@workspace/cookies",
  ],
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
  serverExternalPackages: ["shiki"],
  images: {
    // Covers are external URLs (Unsplash, Cloudinary, etc.) — restrict to
    // domains you actually use. See https://nextjs.org/docs/app/api-reference/components/image#remotepatterns
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
      { protocol: "https", hostname: "picsum.photos" },
      // Vercel avatar endpoint (ADR-023). The session-aware header
      // uses this for the user avatar — same universal fallback that
      // apps/app/components/sidebars/nav-user.tsx uses. The avatar
      // endpoint serves a deterministic SVG for any email, so the
      // marketing site does not need to allowlist each OAuth
      // provider's avatar host individually.
      {
        protocol: "https",
        hostname: "vercel.com",
        pathname: "/api/www/avatar",
      },
    ],
    // Vercel's avatar endpoint returns SVG. The remotePatterns
    // allowlist already restricts to vercel.com/api/www/avatar, so
    // this is safe — same rationale as apps/app/next.config.ts.
    dangerouslyAllowSVG: true,
    contentDispositionType: "attachment",
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
    // On networks where DNS64/NAT64 resolves external hostnames to
    // private IPv6 ranges, Next.js's SSRF guard incorrectly rejects
    // the optimization request. remotePatterns is locked to
    // vercel.com/api/www/avatar, so allowing local-IP resolution
    // is safe — same trade-off as apps/app.
    dangerouslyAllowLocalIP: true,
  },
  async redirects() {
    return [
      // The footer links to /privacy-policy for human readability; the
      // canonical page lives at /privacy. Forward permanently.
      {
        source: "/privacy-policy",
        destination: "/privacy",
        permanent: true,
      },
    ]
  },
}

// The runtime return is synchronous `NextConfig`; the plugin's
// declared return type is `Promise<Partial<NextConfig>>` (stale doc).
// Composing with `withContentCollections` works synchronously.
//
// `withContentCollections(nextConfig)` is declared `async` (the
// upstream wrapper awaits its own typegen pass), but in a production
// build the typegen has already been run by the `content-collections`
// build script. The runtime value is fully sync. We cast to the sync
// wrapper type to compose it with `withNextIntl` (which is genuinely
// sync).
const withContentCollectionsSync = withContentCollections as unknown as NextConfigWrapper

const _config = withNextIntl(withContentCollectionsSync(nextConfig))
export default _config
