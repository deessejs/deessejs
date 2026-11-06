import type { MetadataRoute } from "next"
import { source } from "@/lib/source"

const DOCS_URL = "https://docs.deessejs.com"

export default function sitemap(): MetadataRoute.Sitemap {
  return source.getPages().map((page) => ({
    url: new URL(page.url, DOCS_URL).toString(),
  }))
}
