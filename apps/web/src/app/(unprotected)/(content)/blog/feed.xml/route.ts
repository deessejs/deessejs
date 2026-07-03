import { getAllPosts } from "@/lib/blog/posts";
import { buildBlogFeed } from "@/lib/blog/feed";

import { WEB_URL } from "@/lib/urls";

/**
 * RSS 2.0 feed for the blog.
 *
 * Per spec 15.16: RSS is the ONLY subscription mechanism — no in-app
 * fan-out, no email digest. Zero vendor lock-in.
 */
const SITE_ORIGIN = WEB_URL;

export const dynamic = "force-static";

export function GET() {
  const xml = buildBlogFeed(getAllPosts(), SITE_ORIGIN);
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}