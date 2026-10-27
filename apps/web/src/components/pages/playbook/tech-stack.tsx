import { Section } from "@/components/marketing/section"
import { TechStackGrid } from "@/components/marketing/tech-stack-grid"
import { TECH_STACK } from "@/lib/marketing/home-data"

/**
 * Built with: the rotating logo wall, matching the homepage's
 * TechStack section.
 *
 * Reuses the shared `TechStackGrid` and the same `TECH_STACK` data,
 * so the eight slots and their rotation behave identically to the
 * homepage. The client grid swaps slots on independent timers while
 * keeping every technology unique at each tick, and honours
 * `prefers-reduced-motion` by rendering statically.
 *
 * Section chrome is a `Section` wrapping a `divide-y` stack: the
 * copy row, then the grid. Same as the homepage.
 */
export function TechStack() {
  return (
    <Section>
      <div className="flex flex-col divide-y divide-border">
        <div className="px-8 py-6">
          <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
            Built with the stack senior engineers ship on.
          </p>
        </div>
        <TechStackGrid techs={TECH_STACK} />
      </div>
    </Section>
  )
}
