"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { cn } from "@workspace/ui/lib/utils"
import {
  HomeIcon,
  UserIcon,
  SmartphoneIcon,
  LinkIcon,
  BadgeCheckIcon,
} from "lucide-react"

import { APP_CONFIG } from "@/lib/app-config"

type RailItem = {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
}

const RAIL: RailItem[] = [
  { label: "Home", href: APP_CONFIG.links.home, icon: HomeIcon },
  { label: "Profile", href: "/settings/profile", icon: UserIcon },
  { label: "Sessions", href: "/settings/sessions", icon: SmartphoneIcon },
  {
    label: "Connections",
    href: "/settings/connections",
    icon: LinkIcon,
  },
  { label: "Account", href: "/settings/account", icon: BadgeCheckIcon },
]

/**
 * Returns the href of the active rail entry for the given pathname. The
 * active entry is the one whose href is the longest prefix of `pathname`
 * — `/settings/security/password` highlights Security (not Profile, even
 * though `/settings/...` is a prefix of Profile too).
 */
function activeHref(pathname: string): string {
  let best = ""
  for (const item of RAIL) {
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
 * `<Link>` rows; no shadcn `Sidebar` component (see ADR-030). The rail
 * is ~240 px wide on desktop; on narrow viewports it tightens to icon-only
 * via the `sm:` breakpoint classes below.
 */
export function SettingsRail() {
  const pathname = usePathname()
  const active = activeHref(pathname)

  return (
    <nav
      aria-label="Account navigation"
      className="hidden w-60 shrink-0 border-r bg-background md:block"
    >
      <ul className="flex flex-col gap-0.5 p-2">
        {RAIL.map((item) => {
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
                    : "text-muted-foreground",
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
