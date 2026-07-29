import { allPosts, allReleases } from "content-collections"
import type { Post, Release } from "./types"
import { sortReleasesDesc } from "./types"

export function getAllReleases(): Release[] {
  return sortReleasesDesc(allReleases)
}

export function getReleaseBySlug(slug: string): Release | undefined {
  return allReleases.find((r) => r.slug === slug)
}

export function getLatestRelease(): Release | undefined {
  return getAllReleases()[0]
}

export function getRelatedBlogPosts(release: Release): Post[] {
  if (!release.relatedPosts?.length) return []
  return release.relatedPosts
    .map((slug) => allPosts.find((p) => p.slug === slug))
    .filter((p): p is Post => Boolean(p))
}

export function getAdjacentReleases(slug: string): {
  prev: Release | undefined
  next: Release | undefined
} {
  const sorted = getAllReleases()
  const idx = sorted.findIndex((r) => r.slug === slug)
  if (idx === -1) return { prev: undefined, next: undefined }
  return {
    prev: sorted[idx + 1],
    next: sorted[idx - 1],
  }
}
