/**
 * Mini-screenshot for the team-onboarding template card.
 *
 * Static. Reads as a workspace invite flow:
 *   - header row (workspace label + count)
 *   - 4 invite rows: email + role chip + status icon
 *
 * Same monochrome + 1 emerald accent. The first row uses the
 * accent (already-accepted state); the rest stay pending so the
 * accent stays single-use.
 */

const INVITES = [
  { email: "alice@acme.com",  role: "owner",  status: "ok"     },
  { email: "bob@globex.com",  role: "admin",  status: "ok"     },
  { email: "carol@initech.com", role: "member", status: "pending" },
  { email: "dave@hooli.com",  role: "member", status: "pending" },
] as const

const STATUS: Record<string, string> = {
  ok:      "text-emerald-700 dark:text-emerald-400",
  pending: "text-muted-foreground",
}

const STATUS_GLYPH: Record<string, string> = {
  ok:      "✓",
  pending: "…",
}

export function TeamOnboardingScreenshot() {
  return (
    <div
      aria-hidden
      className="flex h-full flex-col gap-2 bg-background p-3"
    >
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-[10px] text-muted-foreground">
        <span>Workspace · acme</span>
        <span>4 invites</span>
      </div>
      <div className="flex flex-1 flex-col divide-y divide-border">
        {INVITES.map((invite) => (
          <div
            key={invite.email}
            className="flex items-center gap-2 py-1.5 font-mono text-[11px]"
          >
            <span className="flex-1 truncate text-foreground">
              {invite.email}
            </span>
            <span className="w-12 shrink-0 text-muted-foreground">
              {invite.role}
            </span>
            <span
              className={`w-6 shrink-0 text-right ${STATUS[invite.status]}`}
            >
              {STATUS_GLYPH[invite.status]}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
