import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { EcosystemTabs } from "@/app/(marketing)/_components/ecosystem-tabs"

/** Ecosystem — tabbed layout with placeholder mockup + product cards. */
export function Ecosystem() {
  return (
    <Section>
      <SectionHeader
        eyebrow="One ecosystem, four tools"
        title=""
        bordered={false}
      />
      <EcosystemTabs />
    </Section>
  )
}
