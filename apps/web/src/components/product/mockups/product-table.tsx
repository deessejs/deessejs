/**
 * Product CRUD surface — first version.
 *
 * Shows the canonical "domain data" table a B2B SaaS exposes to its
 * users: searchable rows, column metadata, bulk-action affordance,
 * and an export hook.
 *
 * Static. Pairs with the "Product CRUD" capability card in
 * /use-cases/saas-apps. Tiles into the peek pattern of
 * <CapabilitiesTabs>; readable portion sits in the bottom-right.
 *
 * Future edits: replace placeholder rows with examples that map
 * to a concrete vertical (orders, contacts, etc.), add column
 * sort icons, plug in status badges.
 */
const ROWS = [
  { id: "01HFA", label: "Acme Corp",     value: "$2,400",  status: "active"  },
  { id: "02KTB", label: "Globex Inc",    value: "$1,180",  status: "active"  },
  { id: "03MPL", label: "Initech LLC",   value: "$640",    status: "trial"   },
  { id: "04NRP", label: "Umbrella Co",   value: "$3,920",  status: "active"  },
  { id: "05QVX", label: "Hooli",         value: "$0",      status: "paused"  },
] as const

const STATUS_COLOR: Record<string, string> = {
  active: "text-emerald-700 dark:text-emerald-400",
  trial:  "text-amber-700 dark:text-amber-400",
  paused: "text-zinc-500",
}

export function ProductTableMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-label-12 text-muted-foreground">
        <span>Customers</span>
        <span>{ROWS.length} rows</span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {ROWS.map((row) => (
          <li
            key={row.id}
            className="flex items-center gap-2 py-1.5 font-mono text-copy-13"
          >
            <span className="w-12 shrink-0 text-muted-foreground">{row.id}</span>
            <span className="flex-1 truncate text-foreground">{row.label}</span>
            <span className="w-16 shrink-0 text-right text-foreground">
              {row.value}
            </span>
            <span
              className={`w-12 shrink-0 text-right ${STATUS_COLOR[row.status]}`}
            >
              {row.status}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
