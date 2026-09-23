import { cn } from "@workspace/ui/lib/utils"
import type { Stat } from "@/lib/marketing/home-data"

/**
 * 4-cell stats strip rendered at the bottom of the marketing homepage.
 *
 * Two of the four cells are tier-1 third-party metrics (npm + GH
 * stars); the rest are first-party (templates, license). The numbers
 * are hard-coded today and refreshable via npm + GitHub API in a
 * later PR — see the TODO on `STATS` in `lib/marketing/home-data.ts`.
 *
 * Shared-border layout: 2 cols on mobile, 4 cols on md+. Dividers
 * are drawn with `divide-y` / `divide-x` so cells share borders with
 * the parent card.
 */
export function StatsStrip({ stats }: { stats: ReadonlyArray<Stat> }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      {stats.map((stat) => (
        <StatCell key={stat.label} {...stat} />
      ))}
    </div>
  )
}

function StatCell({ label, value }: Stat) {
  return (
    <div
      className={cn(
        "flex flex-col p-6 items-center justify-center text-center gap-1",
      )}
    >
      <span className="text-heading-32 lg:text-heading-40 tracking-tight text-foreground">
        {value}
      </span>
      <span className="text-label-13 text-muted-foreground">{label}</span>
    </div>
  )
}
