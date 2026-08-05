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
    ],
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
