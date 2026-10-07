/**
 * Notifications inbox — first version.
 *
 * Shows the operator/owner view of an in-app notification stream:
 *   - Title + 1-line body per notification
 *   - Channel chip (in-app / email / batch)
 *   - Severity dot (info / success / warning) — colour is the only
 *     accent that escapes the monochrome palette
 *
 * Static. Pairs with the "Notifications" capability card in
 * /use-cases/saas-apps. Tiles into the peek pattern of
 * <CapabilitiesTabs>; readable portion sits in the bottom-right.
 *
 * Future edits: add action affordances (mark read, mute), plug
 * in real channel names, surface batch send controls.
 */

const ITEMS = [
  {
    title: "New customer signed up",
    body:  "Hooli upgraded to the Pro plan.",
    channel: "in-app",
    severity: "success",
  },
  {
    title: "Invoice paid",
    body:  "Globex Inc paid invoice #2041 ($640).",
    channel: "email",
    severity: "info",
  },
  {
    title: "Quota alert",
    body:  "Acme Corp hit 80% of API quota.",
    channel: "email",
    severity: "warning",
  },
  {
    title: "Weekly digest",
    body:  "12 new signups, 3 upgrades, 0 cancellations.",
    channel: "batch",
    severity: "info",
  },
] as const

const DOT: Record<string, string> = {
  success: "bg-emerald-500",
  info:    "bg-zinc-400",
  warning: "bg-amber-500",
}

export function NotificationsInboxMockup() {
  return (
    <div className="flex flex-col gap-2 p-3">
      <div className="flex items-center justify-between border-b border-border pb-2 font-mono text-label-12 text-muted-foreground">
        <span>Inbox · 4 unread</span>
        <span>all channels</span>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {ITEMS.map((item) => (
          <li
            key={item.title}
            className="flex items-start gap-3 py-2 leading-5"
          >
            <span
              aria-hidden
              className={`mt-1.5 size-1.5 shrink-0 rounded-full ${DOT[item.severity]}`}
            />
            <div className="flex min-w-0 flex-col gap-0.5">
              <div className="flex items-baseline gap-2">
                <span className="truncate font-mono text-copy-13 text-foreground">
                  {item.title}
                </span>
                <span className="shrink-0 rounded-sm border border-border bg-muted/40 px-1 py-px font-mono text-label-12 text-muted-foreground">
                  {item.channel}
                </span>
              </div>
              <span className="truncate font-mono text-label-12 text-muted-foreground">
                {item.body}
              </span>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}
