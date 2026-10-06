import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { SurfacesTabs } from "@/components/marketing/surfaces-tabs"

/** Surfaces — eyebrow + title + 8-surface tabbed grid. */
export function Surfaces() {
  return (
    <Section>
      <SectionHeader
        eyebrow="Surfaces"
        title="Pick the surface. Get the convention."
        subtitle="Four surfaces, one registry. Each surface ships with the same contracts, the same patterns, and the same guarantees, whether you build it yourself or ship with us."
        action={{ href: "/templates", label: "Explore all surfaces" }}
        bordered={true}
      />
      <SurfacesTabs />
    </Section>
  )
}
