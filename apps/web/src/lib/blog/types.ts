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

/** Sort by calendar date desc; semver desc as a tiebreak. Distinct
 *  from `sortReleasesDesc` (which drives prev/next ordering) so that
 *  the index timeline can stay in chronological order without
 *  breaking the detail page's prev/next nav. */
export function sortReleasesByDateDesc(releases: Release[]): Release[] {
  return [...releases].sort((a, b) => {
    const dateDiff = b.date.localeCompare(a.date)
    if (dateDiff !== 0) return dateDiff
    const va = a.version.split(".").map(Number)
    const vb = b.version.split(".").map(Number)
    for (let i = 0; i < 3; i++) {
      const diff = (vb[i] ?? 0) - (va[i] ?? 0)
      if (diff !== 0) return diff
    }
    return 0
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

export interface ReleaseDateGroup {
  /** Calendar date in `YYYY-MM-DD`. */
  date: string
  releases: Release[]
}

/** Group releases by calendar date, sorted desc by date then by
 *  semver desc within each bucket. */
export function groupReleasesByDate(releases: Release[]): ReleaseDateGroup[] {
  const sorted = sortReleasesByDateDesc(releases)
  const map = new Map<string, Release[]>()
  for (const r of sorted) {
    const list = map.get(r.date) ?? []
    list.push(r)
    map.set(r.date, list)
  }
  return Array.from(map.entries()).map(([date, releases]) => ({
    date,
    releases,
  }))
}
