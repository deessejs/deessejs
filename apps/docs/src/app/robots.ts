import type { MetadataRoute } from "next"

const DOCS_URL = "https://docs.deessejs.com"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/" },
    sitemap: `${DOCS_URL}/sitemap.xml`,
  }
}
