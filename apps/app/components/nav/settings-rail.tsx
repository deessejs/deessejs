"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import {
  HomeIcon,
  ShieldIcon,
  UserIcon,
  SmartphoneIcon,
  LinkIcon,
  BadgeCheckIcon,
} from "lucide-react"

import { APP_CONFIG } from "@/lib/app-config"
import { SETTINGS_PATHS } from "@/lib/settings-paths"
import { authClient } from "@/lib/auth-client"

type RailItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

/**
 * The account-scoped links. The Administration link is added at
 * render time (when the current user has the global `admin` role)
 * rather than here so the static array stays the source of truth for
 * what every authenticated user sees.
 */
const ACCOUNT_RAIL: RailItem[] = [
  { label: "Home", href: APP_CONFIG.links.home, icon: HomeIcon },
  { label: "Profile", href: SETTINGS_PATHS.profile, icon: UserIcon },
  { label: "Sessions", href: SETTINGS_PATHS.sessions, icon: SmartphoneIcon },
  {
    label: "Connections",
    href: SETTINGS_PATHS.connections,
    icon: LinkIcon,
  },
  { label: "Account", href: SETTINGS_PATHS.account, icon: BadgeCheckIcon },
]

/**
 * Returns the href of the active rail entry for the given pathname
 * from a per-render list. The active entry is the one whose href is
 * the longest prefix of `pathname` — `/account/settings/account/delete`
 * highlights Account (not Profile, even though `/account/settings/...`
 * is a prefix of Profile too). Accepting the list as a parameter lets
 * the caller pass a render-scoped array (e.g. with the Administration
 * link included) without the helper needing to know about
 * conditional entries.
 */
function activeHref(pathname: string, items: RailItem[]): string {
  let best = ""
  for (const item of items) {
    if (
      (pathname === item.href || pathname.startsWith(`${item.href}/`)) &&
      item.href.length > best.length
    ) {
      best = item.href
    }
  }
  return best
}

/**
 * Custom left rail for the authenticated apps/app shell. Plain `<nav>` +
 * `<Link>` rows; no shadcn `Sidebar` component. The rail
 * is ~240 px wide on desktop; on narrow viewports it tightens to icon-only
 * via the `sm:` breakpoint classes below.
 *
 * The Administration link is shown only when `authClient.useSession()`
 * reports `data?.user.role === "admin"` (RFC: "DeesseJS Administration
 * Routes — V1" §7). The link is a navigation convenience — the server
 * guard in `apps/app/lib/admin-auth.ts` remains the authoritative
 * access check. Hiding the link does not lock the route; the server
 * still rejects unauthenticated or non-admin requests.
 */
export function SettingsRail() {
  const pathname = usePathname()
  // Top-level hook call: component top-level is a valid hook context per
  // React's rules. The audit §3.5 bug was calling useSession() inside an
  // async callback (useCallback body), which IS a violation. Here at
  // top-level, useSession() is correct. The workspace-wide Oxlint rule
  // in `.oxlintrc.json` flags every `authClient.useSession`
  // call regardless of context — see the same disable comment in
  // `apps/app/components/sidebars/nav-user.tsx`.
  const { data: session } = authClient.useSession()
  const isAdmin = session?.user?.role === "admin"

  const items: RailItem[] = isAdmin
    ? [
        ...ACCOUNT_RAIL,
        {
          label: "Administration",
          href: "/admin/templates",
          icon: ShieldIcon,
        },
      ]
    : ACCOUNT_RAIL

  const active = activeHref(pathname, items)

  return (
    <nav
      aria-label="Account navigation"
      className="hidden w-60 shrink-0 border-r bg-background md:block"
    >
      <ul className="flex flex-col gap-0.5 p-2">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = active === item.href
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
                  "hover:bg-muted hover:text-foreground",
                  isActive
                    ? "bg-muted font-medium text-foreground"
                    : "text-muted-foreground"
                )}
              >
                <Icon className="size-4 shrink-0" aria-hidden />
                <span>{item.label}</span>
              </Link>
            </li>
          )
        })}
      </ul>
    </nav>
  )
}
