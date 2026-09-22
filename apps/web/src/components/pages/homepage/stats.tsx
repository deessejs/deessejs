import { Section } from "@/app/(marketing)/_components/section"
import { StatsStrip } from "@/app/(marketing)/_components/stats-strip"
import { STATS } from "@/lib/marketing/home-data"

/** Stats — 4-cell strip (npm, GH, templates, license). */
export function Stats() {
  return (
    <Section>
      <StatsStrip stats={STATS} />
    </Section>
  )
}
