import { getAllReleases } from "@/lib/blog/releases";
import { buildChangelogFeed } from "@/lib/blog/feed";

import { WEB_URL } from "@/lib/urls";

/**
 * RSS 2.0 feed for the changelog.
 *
 * Per spec 15.16: the ONLY subscription mechanism for release notes.
 * Zero vendor lock-in — no in-app fan-out, no email digest.
 */
const SITE_ORIGIN = WEB_URL;

export const dynamic = "force-static";

export function GET() {
  const xml = buildChangelogFeed(getAllReleases(), SITE_ORIGIN);
  return new Response(xml, {
    headers: {
      "content-type": "application/rss+xml; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}