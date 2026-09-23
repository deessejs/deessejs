import type { MetadataRoute } from "next"
import { WEB_URL } from "@/lib/app-config"

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/api/", "/_next/", "/_vercel/"],
      },
    ],
    sitemap: `${WEB_URL}/sitemap.xml`,
    host: WEB_URL,
  }
}
