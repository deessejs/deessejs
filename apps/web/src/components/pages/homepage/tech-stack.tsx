import { Section } from "@/app/(marketing)/_components/section"
import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { TECH_STACK } from "@/lib/marketing/home-data"

/** Built with — copy + logo wall. */
export function TechStack() {
  return (
    <Section>
      <div className="px-8 py-6">
        <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
          Built with the stack senior engineers ship on.
        </p>
      </div>
      <TechStackGrid techs={TECH_STACK} />
    </Section>
  )
}
