/**
 * Mini-screenshot for the ops-console template card.
 *
 * Static. Reads as an operator dashboard:
 *   - 3 KPI tiles at the top (active / pending / failed counts)
 *   - 4 user-table rows at the bottom with role + last-seen
 *
 * Same monochrome + 1 emerald accent recipe as the SaaS card.
 */

const KPIS = [
  { label: "active",  value: "1,284" },
  { label: "pending", value: "32"    },
  { label: "failed",  value: "7"     },
] as const

const USERS = [
  { id: "u_8a3f", name: "alice@acme.com",  role: "owner", lastSeen: "2m"  },
  { id: "u_8b2c", name: "bob@globex.com",  role: "admin", lastSeen: "1h"  },
  { id: "u_8c11", name: "carol@initech.com", role: "member", lastSeen: "1d" },
  { id: "u_8d4e", name: "dave@hooli.com",  role: "member", lastSeen: "3d" },
] as const

export function OpsConsoleScreenshot() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col gap-2 bg-background p-3"
    >
      <div className="grid grid-cols-3 divide-x divide-border border-y border-border">
        {KPIS.map((kpi) => (
          <div
            key={kpi.label}
            className="flex flex-col gap-0.5 p-2"
          >
            <span className="font-mono text-[9px] uppercase tracking-wider text-muted-foreground">
              {kpi.label}
            </span>
            <span className="font-mono text-[13px] font-medium text-foreground">
              {kpi.value}
            </span>
          </div>
        ))}
      </div>
      <div className="flex flex-1 flex-col divide-y divide-border">
        {USERS.map((user) => (
          <div
            key={user.id}
            className="flex items-center gap-2 py-1.5 font-mono text-[11px]"
          >
            <span className="flex-1 truncate text-foreground">
              {user.name}
            </span>
            <span className="w-12 shrink-0 text-muted-foreground">
              {user.role}
            </span>
            <span className="w-8 shrink-0 text-right text-emerald-700 dark:text-emerald-400">
              {user.lastSeen}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
