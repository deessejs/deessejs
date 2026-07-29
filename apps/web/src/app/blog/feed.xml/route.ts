import { getAllPosts } from "@/lib/blog/posts"
import { buildBlogFeed } from "@/lib/blog/feed"
import { WEB_URL } from "@/lib/urls"

export const dynamic = "force-static"

export function GET() {
  const xml = buildBlogFeed(getAllPosts(), WEB_URL)
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  })
}
