import { allAuthors, allPosts, allReleases } from "content-collections"

export type Author = (typeof allAuthors)[number]
export type Post = (typeof allPosts)[number]
export type Release = (typeof allReleases)[number]

export function getAllTags(): string[] {
  const tagSet = new Set<string>()
  for (const post of allPosts) {
    for (const tag of post.tags) {
      tagSet.add(tag)
    }
  }
  return Array.from(tagSet).sort()
}

export const RELEASE_CATEGORIES = [
  "added",
  "changed",
  "fixed",
  "deprecated",
  "removed",
  "security",
] as const

export type ReleaseCategory = (typeof RELEASE_CATEGORIES)[number]

export const RELEASE_CATEGORY_LABELS: Record<ReleaseCategory, string> = {
  added: "Added",
  changed: "Changed",
  fixed: "Fixed",
  deprecated: "Deprecated",
  removed: "Removed",
  security: "Security",
}

export function sortReleasesDesc(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => {
    const va = a.version.split(".").map(Number)
    const vb = b.version.split(".").map(Number)
    for (let i = 0; i < 3; i++) {
      const diff = (vb[i] ?? 0) - (va[i] ?? 0)
      if (diff !== 0) return diff
    }
    return b.date.localeCompare(a.date)
  })
}

export interface ReleaseGroup {
  label: string
  releases: Release[]
}

export function groupReleasesByMinor(releases: Release[]): ReleaseGroup[] {
  const sorted = sortReleasesDesc(releases)
  const map = new Map<string, Release[]>()
  for (const r of sorted) {
    const parts = r.version.split(".")
    const minor = `${parts[0] ?? "0"}.${parts[1] ?? "0"}`
    const list = map.get(minor) ?? []
    list.push(r)
    map.set(minor, list)
  }
  return Array.from(map.entries()).map(([label, releases]) => ({
    label,
    releases,
  }))
}
