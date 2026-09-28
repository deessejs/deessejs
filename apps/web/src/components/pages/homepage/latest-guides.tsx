import { allKbGuides } from "content-collections"

import { Section } from "@/app/(marketing)/_components/section"
import { LatestGuidesSection } from "@/app/(marketing)/_components/latest-guides-section"

/**
 * Latest guides — 8 featured KB articles, navigated via a shadcn
 * carousel whose prev/next buttons live in the SectionHeader
 * (top-right of the section).
 *
 * Server Component: pulls the top 8 KB guides from content-collections
 * at build time and serialises their frontmatter (slug, title,
 * description, url) into a plain object array. The actual carousel
 * runtime (Embla instance, prev/next handlers, canScroll state) is
 * handled by the Client `<LatestGuidesSection>` so Embla never ships
 * to the server.
 */
export function LatestGuides() {
  const featuredGuides = allKbGuides.slice(0, 8)
  const carouselGuides = featuredGuides.map((guide) => ({
    slug: guide.slug,
    title: guide.title,
    description: guide.description,
    url: guide.url,
  }))

  return (
    <Section>
      <LatestGuidesSection guides={carouselGuides} />
    </Section>
  )
}
