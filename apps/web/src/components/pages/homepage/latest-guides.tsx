import { codeToHtml } from "shiki"
import { allKbGuides } from "content-collections"

import { Section } from "@/components/marketing/section"
import { LatestGuidesSection } from "@/app/(marketing)/_components/latest-guides-section"
import {
  LATEST_GUIDES_SNIPPETS,
  type LatestGuidesSlug,
} from "@/app/(marketing)/_components/latest-guides-snippets"

/**
 * Latest guides — 8 featured KB articles, navigated via a shadcn
 * carousel whose prev/next buttons live in a border-t strip below
 * the carousel track.
 *
 * Server Component: pulls the top 8 KB guides from content-collections
 * at build time, looks up a per-guide code snippet in
 * `LATEST_GUIDES_SNIPPETS`, asks Shiki for the highlighted HTML, and
 * threads both the guide frontmatter and the highlighted code blocks
 * into the Client `<LatestGuidesSection>` wrapper. Embla stays out of
 * the server bundle.
 *
 * Snippet policy: a guide that doesn't have a matching entry in
 * `LATEST_GUIDES_SNIPPETS` renders an empty hero block (the card still
 * works — just no code visible). The carousel map is exhaustive today
 * (9 entries in the registry, 8 in the carousel) so this fallback
 * should not fire in production.
 */
export async function LatestGuides() {
  const featuredGuides = allKbGuides.slice(0, 8)

  const htmlBySlug: Record<LatestGuidesSlug, string> = {} as Record<
    LatestGuidesSlug,
    string
  >

  const guides = await Promise.all(
    featuredGuides.map(async (guide) => {
      const snippet = LATEST_GUIDES_SNIPPETS[
        guide.slug as LatestGuidesSlug
      ]
      const html = snippet
        ? await codeToHtml(snippet.code, {
            lang: "typescript",
            themes: { light: "github-light", dark: "github-dark" },
            defaultColor: false,
          })
        : ""
      htmlBySlug[guide.slug as LatestGuidesSlug] = html
      const payload = {
        slug: guide.slug,
        title: guide.title,
        description: guide.description,
        url: guide.url,
        html,
        hasSnippet: Boolean(snippet),
        readingTime: guide.readingTime,
      }
      if (guide.author) {
        const author: {
          name: string
          handle: string
          avatar?: string
          role?: string
        } = {
          name: guide.author.name,
          handle: guide.author.handle,
        }
        if (guide.author.avatar) author.avatar = guide.author.avatar
        if (guide.author.role) author.role = guide.author.role
        return { ...payload, author }
      }
      return payload
    }),
  )

  return (
    <Section>
      <LatestGuidesSection guides={guides} />
    </Section>
  )
}
