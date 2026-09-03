import { APP_CONFIG } from "@/lib/app-config"
import { ORG_ID } from "@/lib/seo/organization"
import type { Author } from "@/lib/blog/types"

/**
 * Build the Person JSON-LD payload for an author.
 *
 * Pure function — same inputs, same output — so it can be unit
 * tested in isolation. Both /blog/[slug] (Article.author) and
 * /blog/author/[handle] (the canonical Person anchor) call this
 * factory so the two JSON-LD scripts agree on every field.
 *
 * Shape:
 *   - @id anchored at `${WEB_URL}/blog/author/${handle}#person`
 *     so the article-side Person and the author-page-side Person
 *     resolve to the same node in the crawler graph.
 *   - `worksFor` points at the global Organization @id emitted
 *     from the root layout.
 *   - `url` is the canonical author page, never the raw handle.
 *   - `image` is only emitted when the author frontmatter has
 *     `avatar` set. The Vercel avatar endpoint used for live
 *     user avatars is intentionally not used as a fallback:
 *     it requires an email address, and authors in the MDX schema
 *     do not have one.
 *   - `sameAs` is the union of `twitter`, `github`, and `website`
 *     from the frontmatter, in that order. Empty values are
 *     dropped so the field is omitted entirely when the author
 *     has no verified external profiles.
 */

export type PersonNode = {
  "@context": "https://schema.org"
  "@type": "Person"
  "@id": string
  name: string
  url: string
  worksFor: { "@id": string }
  description?: string
  image?: string
  sameAs?: ReadonlyArray<string>
}

export const personIdFor = (handle: string): string =>
  `${APP_CONFIG.url}/blog/author/${encodeURIComponent(handle)}#person`

export function buildPersonJsonLd(author: Author): PersonNode {
  const sameAs = [author.twitter, author.github, author.website].filter(
    (value): value is string => typeof value === "string" && value.length > 0,
  )

  const node: PersonNode = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": personIdFor(author.handle),
    name: author.name,
    url: `${APP_CONFIG.url}/blog/author/${encodeURIComponent(author.handle)}`,
    worksFor: { "@id": ORG_ID },
  }

  if (author.bio && author.bio.length > 0) {
    node.description = author.bio
  }
  if (author.avatar && author.avatar.length > 0) {
    node.image = author.avatar
  }
  if (sameAs.length > 0) {
    node.sameAs = sameAs
  }

  return node
}