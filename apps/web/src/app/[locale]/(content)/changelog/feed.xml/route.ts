import { getAllReleases } from "@/lib/blog/releases"
import { buildChangelogFeed } from "@/lib/blog/feed"
import { WEB_URL } from "@/lib/urls"

export const dynamic = "force-static"

export function GET() {
  const xml = buildChangelogFeed(getAllReleases(), WEB_URL)
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
