import { allPosts } from "content-collections"
import type { Post } from "./types"

export function getAllPosts(): Post[] {
  return [...allPosts].sort((a, b) => b.date.localeCompare(a.date))
}

export function getPostBySlug(slug: string): Post | undefined {
  return allPosts.find((p) => p.slug === slug)
}

export function getRelatedPosts(currentSlug: string, limit = 3): Post[] {
  const current = allPosts.find((p) => p.slug === currentSlug)
  if (!current) return []

  return allPosts
    .filter((p) => p.slug !== currentSlug)
    .map((p) => ({
      post: p,
      score: p.tags.filter((t) => current.tags.includes(t)).length,
    }))
    .filter((r) => r.score > 0)
    .sort(
      (a, b) =>
        b.score - a.score ||
        new Date(b.post.date).getTime() - new Date(a.post.date).getTime(),
    )
    .slice(0, limit)
    .map((r) => r.post)
}

export function getPostsByTag(tag: string): Post[] {
  return getAllPosts().filter((p) => p.tags.includes(tag))
}

export function getAdjacentPosts(slug: string): {
  prev: Post | undefined
  next: Post | undefined
} {
  const sorted = getAllPosts()
  const idx = sorted.findIndex((p) => p.slug === slug)
  if (idx === -1) return { prev: undefined, next: undefined }
  return {
    prev: sorted[idx + 1],
    next: sorted[idx - 1],
  }
}
