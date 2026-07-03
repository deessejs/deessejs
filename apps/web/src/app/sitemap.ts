import type { MetadataRoute } from "next";
import { allPosts } from "content-collections";
import { allReleases } from "content-collections";

import { WEB_URL } from "@/lib/urls";

/**
 * Root sitemap for deessejs.com.
 * Includes all public marketing routes + every blog post + every changelog entry.
 *
 * Note: legal pages (/legal, /privacy-policy, /terms) are intentionally
 * excluded — they're placeholder thin pages with no SEO value.
 */
export default function sitemap(): MetadataRoute.Sitemap {
  const base = WEB_URL;
  const now = new Date();

  // Static marketing pages
  const staticRoutes: MetadataRoute.Sitemap = [
    {
      url: base,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${base}/about`,
      lastModified: now,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${base}/pricing`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${base}/blog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${base}/changelog`,
      lastModified: now,
      changeFrequency: "weekly",
      priority: 0.6,
    },
  ];

  // Blog posts
  const postEntries: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${base}${post.url}`,
    lastModified: post.updated ? new Date(post.updated) : new Date(post.date),
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  // Changelog entries
  const releaseEntries: MetadataRoute.Sitemap = allReleases.map((release) => ({
    url: `${base}${release.url}`,
    lastModified: new Date(release.date),
    changeFrequency: "yearly" as const,
    priority: 0.5,
  }));

  // Unique tag pages
  const tagSet = new Set<string>();
  for (const post of allPosts) {
    for (const tag of post.tags) tagSet.add(tag);
  }
  const tagEntries: MetadataRoute.Sitemap = Array.from(tagSet).map((tag) => ({
    url: `${base}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }));

  return [
    ...staticRoutes,
    ...postEntries,
    ...releaseEntries,
    ...tagEntries,
  ];
}
