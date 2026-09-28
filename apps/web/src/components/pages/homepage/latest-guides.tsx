import { allKbGuides } from "content-collections"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { LatestGuidesCarousel } from "@/app/(marketing)/_components/latest-guides-carousel"

/**
 * Latest guides — 8 featured KB articles, navigated via the shadcn
 * carousel wrapper.
 *
 * Server Component: pulls the top 8 KB guides from content-collections
 * at build time, serialises their frontmatter (slug, title, description,
 * url) into a plain object array, and hands the array to the Client
 * `<LatestGuidesCarousel>` wrapper. Splitting the data fetch (server)
 * from the carousel runtime (client) keeps `embla-carousel-react`
 * out of the server bundle while preserving build-time MDX rendering.
 *
 * The 3-4 cards-visible scrolling behaviour lives in the Client wrapper.
 * The header action is dropped — the carousel's prev/next buttons replace
 * the "All guides" CTA, so visitors who want everything go through the
 * standard navigation rather than a one-off section header link.
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
      <SectionHeader
        eyebrow="Latest guides"
        title=""
        bordered={false}
      />
      <LatestGuidesCarousel guides={carouselGuides} />
    </Section>
  )
}
