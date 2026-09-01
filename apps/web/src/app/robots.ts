import type { MetadataRoute } from "next"
import { WEB_URL } from "@workspace/ui/lib/config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${WEB_URL}/sitemap.xml`,
  }
}
