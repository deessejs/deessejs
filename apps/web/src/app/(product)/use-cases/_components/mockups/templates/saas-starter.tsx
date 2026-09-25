/**
 * Mini-screenshot for the saas-starter template card.
 *
 * Static, monochrome + 1 emerald accent on a single highlighted
 * row. Reads as a SaaS dashboard list view at first glance:
 *   - header row (label + count)
 *   - 5 rows with id / label / status chip
 *
 * Sized to fit the card hero area (~16:10 aspect ratio) so it
 * reads as a thumbnail, not a full mockup.
 */

const ROWS = [
  { id: "01HFA", label: "Acme Corp",    status: "active" },
  { id: "02KTB", label: "Globex Inc",   status: "active" },
  { id: "03MPL", label: "Initech LLC",  status: "trial"  },
  { id: "04NRP", label: "Umbrella Co",  status: "active" },
  { id: "05QVX", label: "Hooli",        status: "paused" },
] as const

const STATUS: Record<string, string> = {
  active: "text-emerald-700 dark:text-emerald-400",
  trial:  "text-amber-700   dark:text-amber-400",
  paused: "text-muted-foreground",
}

export function SaasStarterScreenshot() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col gap-2 bg-background p-3"
    >
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-[10px] text-muted-foreground">
        <span>Customers</span>
        <span>{ROWS.length} rows</span>
      </div>
      <div className="flex flex-1 flex-col divide-y divide-border">
        {ROWS.map((row) => (
          <div
            key={row.id}
            className="flex items-center gap-2 py-1.5 font-mono text-[11px]"
          >
            <span className="w-10 shrink-0 text-muted-foreground">
              {row.id}
            </span>
            <span className="flex-1 truncate text-foreground">
              {row.label}
            </span>
            <span className={`w-10 shrink-0 text-right ${STATUS[row.status]}`}>
              {row.status}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
