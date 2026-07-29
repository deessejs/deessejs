import type { Post, Release } from "./types"

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;")
}

function rfc822(date: string): string {
  return new Date(date + "T00:00:00Z").toUTCString()
}

function buildItems(items: Array<{
  title: string
  link: string
  description: string
  pubDate: string
  guid: string
}>): string {
  return items
    .map(
      (item) => `    <item>
      <title>${escapeXml(item.title)}</title>
      <link>${escapeXml(item.link)}</link>
      <guid isPermaLink="true">${escapeXml(item.guid)}</guid>
      <pubDate>${item.pubDate}</pubDate>
      <description>${escapeXml(item.description)}</description>
    </item>`,
    )
    .join("\n")
}

function wrapChannel(
  title: string,
  description: string,
  link: string,
  items: string,
): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0">
  <channel>
    <title>${escapeXml(title)}</title>
    <link>${escapeXml(link)}</link>
    <description>${escapeXml(description)}</description>
    <language>en</language>
${items}
  </channel>
</rss>`
}

export function buildBlogFeed(posts: Post[], siteOrigin: string): string {
  const items = posts.map((post) => ({
    title: post.title,
    link: `${siteOrigin}${post.url}`,
    description: post.description,
    pubDate: rfc822(post.date),
    guid: `${siteOrigin}${post.url}`,
  }))
  return wrapChannel(
    "Blog",
    "Articles and updates.",
    `${siteOrigin}/blog`,
    buildItems(items),
  )
}

export function buildChangelogFeed(
  releases: Release[],
  siteOrigin: string,
): string {
  const items = releases.map((release) => ({
    title: `${release.version} — ${release.title}`,
    link: `${siteOrigin}${release.url}`,
    description: release.description,
    pubDate: rfc822(release.date),
    guid: `${siteOrigin}${release.url}`,
  }))
  return wrapChannel(
    "Changelog",
    "Public release notes.",
    `${siteOrigin}/changelog`,
    buildItems(items),
  )
}
