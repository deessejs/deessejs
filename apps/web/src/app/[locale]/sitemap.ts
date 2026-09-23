import type { MetadataRoute } from "next"
import { WEB_URL } from "@/lib/app-config"
import { allPosts, allReleases, allAuthors, allKbTopics, allKbGuides } from "content-collections"

/**
 * Sitemap — ADR-031 Decision §10.
 *
 * Each URL appears once per locale, with `alternates.languages`
 * pointing to the same path under both `/<path>` (EN, defaultLocale,
 * unprefixed) and `/fr<path>` (FR, prefixed). The `x-default`
 * variant points at the EN canonical so Google understands that
 * the unprefixed URL is the source of truth.
 *
 * For a path `/foo`, the EN entry has `alternates.languages = { 'en':
 * '/foo', 'fr': '/fr/foo', 'x-default': '/foo' }` and the FR entry
 * has the same alternates — cross-linking is symmetric so both
 * pages credit the cluster.
 */

type SitemapEntry = MetadataRoute.Sitemap[number]

function hreflangs(path: string) {
  return {
    en: `${WEB_URL}${path}`,
    fr: `${WEB_URL}/fr${path}`,
    "x-default": `${WEB_URL}${path}`,
  }
}

function wrap(
  url: string,
  pathForAlternates: string,
  extras: Partial<SitemapEntry>,
): SitemapEntry {
  return {
    url,
    lastModified: new Date(),
    ...extras,
    alternates: { languages: hreflangs(pathForAlternates) },
  } as SitemapEntry
}

function entryFor(
  canonicalPath: string,
  changeFrequency: SitemapEntry["changeFrequency"],
  priority: number,
): SitemapEntry[] {
  // Strip a leading slash so we can build both URLs from one helper.
  const path = canonicalPath.startsWith("/")
    ? canonicalPath
    : `/${canonicalPath}`
  return [
    wrap(`${WEB_URL}${path}`, path, {
      changeFrequency,
      priority,
    }),
    wrap(`${WEB_URL}/fr${path === "/" ? "" : path}`, path, {
      changeFrequency,
      priority: Math.max(0.1, priority - 0.1),
    }),
  ]
}

const STATIC_PATHS: ReadonlyArray<{
  path: string
  changeFrequency: SitemapEntry["changeFrequency"]
  priority: number
}> = [
  { path: "/", changeFrequency: "weekly", priority: 1 },
  { path: "/templates", changeFrequency: "daily", priority: 0.9 },
  { path: "/blog", changeFrequency: "daily", priority: 0.9 },
  { path: "/changelog", changeFrequency: "weekly", priority: 0.8 },
  { path: "/about", changeFrequency: "monthly", priority: 0.5 },
  { path: "/manifesto", changeFrequency: "monthly", priority: 0.6 },
  { path: "/principles", changeFrequency: "monthly", priority: 0.6 },
  { path: "/vision", changeFrequency: "monthly", priority: 0.6 },
  { path: "/ecosystem", changeFrequency: "monthly", priority: 0.6 },
  { path: "/stack", changeFrequency: "monthly", priority: 0.7 },
  { path: "/pricing", changeFrequency: "monthly", priority: 0.7 },
  { path: "/help", changeFrequency: "monthly", priority: 0.4 },
  { path: "/oss", changeFrequency: "monthly", priority: 0.5 },
  { path: "/students", changeFrequency: "monthly", priority: 0.5 },
  { path: "/enterprise", changeFrequency: "monthly", priority: 0.6 },
  { path: "/knowledge-base", changeFrequency: "monthly", priority: 0.5 },
  { path: "/customers", changeFrequency: "monthly", priority: 0.5 },
  { path: "/privacy", changeFrequency: "monthly", priority: 0.5 },
  { path: "/terms", changeFrequency: "monthly", priority: 0.5 },
  { path: "/cookies", changeFrequency: "monthly", priority: 0.3 },
]

// Use cases — single source of truth shared with use-cases/[slug]/page.tsx.
const USE_CASE_SLUGS = [
  "saas-apps",
  "ai-products",
  "landing-pages",
  "api-backends",
  "internal-tools",
  "open-source",
  "mobile-backend",
] as const

export default function sitemap(): MetadataRoute.Sitemap {
  const staticEntries = STATIC_PATHS.flatMap((s) =>
    entryFor(s.path, s.changeFrequency, s.priority),
  )

  const blogEntries = allPosts.flatMap((post) => {
    const path = post.url
    return [
      wrap(`${WEB_URL}${path}`, path, {
        lastModified: post.updated ?? post.date,
        changeFrequency: "monthly",
        priority: post.tags.length > 0 ? 0.7 : 0.6,
      }),
      wrap(`${WEB_URL}/fr${path}`, path, {
        lastModified: post.updated ?? post.date,
        changeFrequency: "monthly",
        priority: post.tags.length > 0 ? 0.6 : 0.5,
      }),
    ]
  })

  const changelogEntries = allReleases.flatMap((release) => {
    const path = release.url
    return [
      wrap(`${WEB_URL}${path}`, path, {
        lastModified: release.date,
        changeFrequency: "monthly",
        priority: 0.6,
      }),
      wrap(`${WEB_URL}/fr${path}`, path, {
        lastModified: release.date,
        changeFrequency: "monthly",
        priority: 0.5,
      }),
    ]
  })

  const tagEntries = Array.from(
    new Set(allPosts.flatMap((p) => p.tags)),
  ).flatMap((tag) =>
    entryFor(
      `/blog/tag/${encodeURIComponent(tag)}`,
      "weekly",
      0.4,
    ),
  )

  const authorEntries = allAuthors.flatMap((author) =>
    entryFor(
      `/blog/author/${encodeURIComponent(author.handle)}`,
      "weekly",
      0.4,
    ),
  )

  const kbTopicEntries = allKbTopics.flatMap((topic) => {
    const path = topic.url
    return [
      wrap(`${WEB_URL}${path}`, path, {
        changeFrequency: "monthly",
        priority: 0.4,
      }),
      wrap(`${WEB_URL}/fr${path}`, path, {
        changeFrequency: "monthly",
        priority: 0.3,
      }),
    ]
  })

  const kbGuideEntries = allKbGuides.flatMap((guide) => {
    const path = guide.url
    return [
      wrap(`${WEB_URL}${path}`, path, {
        changeFrequency: "monthly",
        priority: 0.4,
      }),
      wrap(`${WEB_URL}/fr${path}`, path, {
        changeFrequency: "monthly",
        priority: 0.3,
      }),
    ]
  })

  const useCaseEntries = USE_CASE_SLUGS.flatMap((slug) =>
    entryFor(`/use-cases/${slug}`, "monthly", 0.5),
  )

  return [
    ...staticEntries,
    ...blogEntries,
    ...changelogEntries,
    ...tagEntries,
    ...authorEntries,
    ...kbTopicEntries,
    ...kbGuideEntries,
    ...useCaseEntries,
  ]
}
