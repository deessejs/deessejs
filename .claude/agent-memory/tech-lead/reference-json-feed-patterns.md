---
name: reference-json-feed-patterns
description: JSON Feed v1.1 implementation pattern for DeesseJS — alongside the existing RSS feed at /blog/feed.xml and /changelog/feed.xml. Cheap (30 min) P0 from the 2026 landscape research.
metadata:
  type: reference
---

# JSON Feed v1.1 — DeesseJS implementation reference

JSON Feed is the agent-preferred syndication format in 2026. Per `project-2026-saas-template-landscape.md`, Supastarter + MakerKit BlogPress both ship JSON Feed alongside RSS. DeesseJS currently has RSS only — adding JSON Feed is ~30 min of work.

**Spec:** https://www.jsonfeed.org/version/1.1/

## Why ship both (not just RSS)

- **Agents prefer JSON:** no XML parser needed, single-line decode
- **RSS readers still dominant** for human power-users (NetNewsWire, Feedbin, etc.)
- **Defensive redundancy:** if one feed format breaks, the other survives
- **Zero vendor lock-in** (fits DeesseJS wedge)

## File structure to add

```
apps/web/src/
├── lib/blog/
│   ├── feed.ts           # RSS 2.0 generator (existing — DO NOT change)
│   └── json-feed.ts      # NEW — JSON Feed v1.1 generator
└── app/(unprotected)/(content)/
    ├── blog/
    │   ├── feed.xml/route.ts           # existing
    │   └── feed.json/route.ts          # NEW
    └── changelog/
        ├── feed.xml/route.ts           # existing
        └── feed.json/route.ts          # NEW
```

Plus update `metadata` in each index page to advertise both:

```ts
alternates: {
  canonical: "/blog",
  types: {
    "application/rss+xml":  "/blog/feed.xml",
    "application/feed+json": "/blog/feed.json",  // NEW
  },
},
```

## The JSON Feed schema (v1.1)

```json
{
  "version": "https://jsonfeed.org/version/1.1",
  "title": "DeesseJS Blog",
  "home_page_url": "https://deessejs.com/blog",
  "feed_url": "https://deessejs.com/blog/feed.json",
  "description": "Articles, tutorials, and updates from the DeesseJS team.",
  "language": "en",
  "icon": "https://deessejs.com/icon.svg",
  "favicon": "https://deessejs.com/favicon.ico",
  "authors": [
    {
      "name": "DeesseJS",
      "url": "https://deessejs.com",
      "avatar": "https://github.com/martyy-code.png"
    }
  ],
  "items": [
    {
      "id": "https://deessejs.com/blog/agents-are-now-first-class-developers",
      "url": "https://deessejs.com/blog/agents-are-now-first-class-developers",
      "title": "Agents are now first-class developers",
      "summary": "Why DeesseJS treats AI agents as the primary users...",
      "content_html": "<p>When we started DeesseJS, the goal was clear...</p>",
      "image": "https://deessejs.com/blog/agents-are-now-first-class-developers/og.png",
      "date_published": "2026-06-26T00:00:00Z",
      "date_modified": "2026-06-26T00:00:00Z",
      "authors": [{"name": "Diego Pereira"}],
      "tags": ["agentic", "architecture", "positioning"]
    }
  ]
}
```

## Implementation pattern (mirror feed.ts)

```ts
// apps/web/src/lib/blog/json-feed.ts
import type { Post, Release } from "./types";

export function buildBlogJsonFeed(posts: Post[], siteOrigin: string) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: "DeesseJS Blog",
    home_page_url: `${siteOrigin}/blog`,
    feed_url: `${siteOrigin}/blog/feed.json`,
    description: "Articles, tutorials, and updates from the DeesseJS team.",
    language: "en",
    icon: `${siteOrigin}/icon.svg`,
    favicon: `${siteOrigin}/favicon.ico`,
    authors: [{ name: "DeesseJS", url: siteOrigin }],
    items: posts.map((post) => ({
      id: `${siteOrigin}${post.url}`,
      url: `${siteOrigin}${post.url}`,
      title: post.title,
      summary: post.description,
      date_published: `${post.date}T00:00:00Z`,
      date_modified: post.updated ? `${post.updated}T00:00:00Z` : `${post.date}T00:00:00Z`,
      authors: [{ name: post.author.name }],
      tags: post.tags,
      // image: `${siteOrigin}${post.url}/opengraph-image`, // if/when added
    })),
  };
}

export function buildChangelogJsonFeed(releases: Release[], siteOrigin: string) {
  return {
    version: "https://jsonfeed.org/version/1.1",
    title: "DeesseJS Changelog",
    home_page_url: `${siteOrigin}/changelog`,
    feed_url: `${siteOrigin}/changelog/feed.json`,
    description: "Public release notes for DeesseJS. Subscribe via RSS or JSON Feed — no vendor lock-in.",
    language: "en",
    icon: `${siteOrigin}/icon.svg`,
    favicon: `${siteOrigin}/favicon.ico`,
    authors: [{ name: "DeesseJS", url: siteOrigin }],
    items: releases.map((release) => ({
      id: `${siteOrigin}${release.url}`,
      url: `${siteOrigin}${release.url}`,
      title: `${release.version} — ${release.title}`,
      summary: release.description,
      date_published: `${release.date}T00:00:00Z`,
      tags: release.categories,
    })),
  };
}
```

## Route handler pattern (mirror feed.xml/route.ts)

```ts
// apps/web/src/app/(unprotected)/(content)/blog/feed.json/route.ts
import { getAllPosts } from "@/lib/blog/posts";
import { buildBlogJsonFeed } from "@/lib/blog/json-feed";

const SITE_ORIGIN = "https://deessejs.com";

export const dynamic = "force-static";

export function GET() {
  const feed = buildBlogJsonFeed(getAllPosts(), SITE_ORIGIN);
  return new Response(JSON.stringify(feed, null, 2), {
    headers: {
      "content-type": "application/feed+json; charset=utf-8",
      "cache-control": "public, max-age=3600, s-maxage=3600",
    },
  });
}
```

## Discovering the feeds (link rel="alternate")

In each page's `<head>`, Next.js will emit the `<link rel="alternate">` tags automatically when you declare them in metadata. Format:

```html
<link rel="alternate" type="application/rss+xml"  title="DeesseJS Blog" href="/blog/feed.xml" />
<link rel="alternate" type="application/feed+json" title="DeesseJS Blog" href="/blog/feed.json" />
```

This is the discoverability standard for 2026 — feed readers auto-detect feeds when crawling a site.

## Effort estimate

- Add `json-feed.ts`: 10 min
- Add `feed.json/route.ts` x 2 (blog + changelog): 10 min
- Update `metadata.alternates` x 2: 5 min
- Test: 5 min

**Total: ~30 min. P0 from the 2026 landscape research.**

## Anti-patterns to avoid

- ❌ Don't add `content_html` from raw MDX without sanitization — could XSS the feed readers
- ❌ Don't change the feed URL after launch (breaks reader subscriptions silently)
- ❌ Don't skip `date_published` — agents rely on this for ingestion ordering

## How to apply

- When asked about syndication / subscription / RSS — recommend shipping BOTH RSS + JSON Feed.
- When asked about agents consuming content — JSON Feed is the standard.
- When the marketing site gains new content surfaces (e.g. /changelog/rss, future /docs feed) — same pattern applies.

## Related memory

- `project-2026-saas-template-landscape.md` — strategic context (RSS + JSON Feed is the 2026 pattern)
- `reference-content-collections-next16-patterns.md` — the RSS feed.ts implementation pattern (mirror for JSON Feed)