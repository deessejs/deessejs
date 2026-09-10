import type { MetadataRoute } from "next"
import { WEB_URL } from "@/lib/app-config"
import { allPosts, allReleases, allAuthors, allKbTopics, allKbGuides } from "content-collections"

export default function sitemap(): MetadataRoute.Sitemap {
  const staticPages: MetadataRoute.Sitemap = [
    {
      url: WEB_URL,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${WEB_URL}/templates`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${WEB_URL}/blog`,
      lastModified: new Date(),
      changeFrequency: "daily",
      priority: 0.9,
    },
    {
      url: `${WEB_URL}/changelog`,
      lastModified: new Date(),
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${WEB_URL}/privacy`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/cookies`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${WEB_URL}/terms`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/about`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/manifesto`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${WEB_URL}/principles`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${WEB_URL}/vision`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${WEB_URL}/ecosystem`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${WEB_URL}/stack`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${WEB_URL}/pricing`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${WEB_URL}/help`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.4,
    },
    {
      url: `${WEB_URL}/oss`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/students`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/enterprise`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${WEB_URL}/knowledge-base`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/customers`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.5,
    },
    {
      url: `${WEB_URL}/login`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
    {
      url: `${WEB_URL}/signup`,
      lastModified: new Date(),
      changeFrequency: "monthly",
      priority: 0.3,
    },
  ]

  const blogPosts: MetadataRoute.Sitemap = allPosts.map((post) => ({
    url: `${WEB_URL}${post.url}`,
    lastModified: post.updated ?? post.date,
    changeFrequency: "monthly" as const,
    priority: post.tags.length > 0 ? 0.7 : 0.6,
  }))

  const changelogEntries: MetadataRoute.Sitemap = allReleases.map((release) => ({
    url: `${WEB_URL}${release.url}`,
    lastModified: release.date,
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }))

  const authorPages: MetadataRoute.Sitemap = allAuthors.map((author) => ({
    url: `${WEB_URL}/blog/author/${encodeURIComponent(author.handle)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }))

  // Collect all unique tags from posts
  const tagPages: MetadataRoute.Sitemap = Array.from(
    new Set(allPosts.flatMap((p) => p.tags))
  ).map((tag) => ({
    url: `${WEB_URL}/blog/tag/${encodeURIComponent(tag)}`,
    lastModified: new Date(),
    changeFrequency: "weekly" as const,
    priority: 0.4,
  }))

  const kbTopicPages: MetadataRoute.Sitemap = allKbTopics.map((topic) => ({
    url: `${WEB_URL}${topic.url}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }))

  const kbGuidePages: MetadataRoute.Sitemap = allKbGuides.map((guide) => ({
    url: `${WEB_URL}${guide.url}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.4,
  }))

  // Use cases — hardcoded list mirrors the same hardcoded record in
  // apps/web/src/app/(product)/use-cases/[slug]/page.tsx. Single-source
  // would mean a content collection; for now this stays in sync by
  // virtue of being a small, hand-curated list.
  const useCaseSlugs = [
    "saas-apps",
    "ai-products",
    "landing-pages",
    "api-backends",
    "internal-tools",
    "open-source",
    "mobile-backend",
  ] as const

  const useCasePages: MetadataRoute.Sitemap = useCaseSlugs.map((slug) => ({
    url: `${WEB_URL}/use-cases/${slug}`,
    lastModified: new Date(),
    changeFrequency: "monthly" as const,
    priority: 0.5,
  }))

  return [
    ...staticPages,
    ...blogPosts,
    ...changelogEntries,
    ...authorPages,
    ...tagPages,
    ...kbTopicPages,
    ...kbGuidePages,
    ...useCasePages,
  ]
}
