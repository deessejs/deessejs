import type { NextConfig } from "next"
import { withContentCollections } from "@content-collections/next"

const nextConfig: NextConfig = {
  transpilePackages: ["@workspace/ui"],
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

export default withContentCollections(nextConfig)
