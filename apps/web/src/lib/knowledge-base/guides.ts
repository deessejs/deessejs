import { allKbGuides } from "content-collections"

/**
 * Find guides related to a given guide by topic match + product
 * overlap. Same scoring shape as `lib/blog/posts.ts:getRelatedPosts`:
 * 1 point for the same topic, 1 point per shared product.
 *
 * Returns up to `limit` guides, sorted by descending score.
 *
 * If no guide has a positive overlap (e.g., a single-guide topic
 * with no product overlap with the rest of the corpus), falls
 * back to the first guides in the collection, ordered by their
 * `order` field. The fallback keeps the section visible and the
 * visitor oriented; an empty section reads as a bug.
 */

export function getRelatedGuides(
  slug: string,
  limit = 3,
): Array<{
  slug: string
  title: string
  description: string
  topic: string
  products: string[]
  url: string
}> {
  const current = allKbGuides.find((g) => g.slug === slug)
  if (!current) return []

  const scored = allKbGuides
    .filter((g) => g.slug !== slug)
    .map((g) => {
      const score =
        (g.topic === current.topic ? 1 : 0) +
        g.products.filter((p) => current.products.includes(p)).length
      return { guide: g, score }
    })

  const withOverlap = scored
    .filter((r) => r.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((r) => r.guide)

  if (withOverlap.length > 0) return withOverlap

  // Fallback: no guide has a positive overlap with this one.
  // Return the first guides by `order` so the section is never
  // empty when the corpus has guides. (Single-guide topics hit
  // this path; the section is still useful as a "discover more"
  // affordance.)
  return allKbGuides
    .filter((g) => g.slug !== slug)
    .sort((a, b) => a.order - b.order)
    .slice(0, limit)
}