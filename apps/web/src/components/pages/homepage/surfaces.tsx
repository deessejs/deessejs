import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { SurfacesTabs } from "@/app/(marketing)/_components/surfaces-tabs"

/** Surfaces — eyebrow + title + 8-surface tabbed grid. */
export function Surfaces() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Pick the surface, skip the boilerplate"
        title="Pick the surface. Get the convention."
        subtitle="Six surfaces, one registry. Each surface ships with the same contracts, the same patterns, and the same guarantees, whether you build it yourself or ship with us."
        action={{ href: "/templates", label: "Explore all surfaces" }}
        bordered={false}
      />
      <SurfacesTabs />
    </Section>
  )
}
