import Link from "next/link"

import { Button } from "@deessejs/ui/components/button"
import { cn } from "@deessejs/ui/lib/utils"

/**
 * AppHeader — the top navigation bar for the authenticated app surface
 * ((app)/layout.tsx). Sticky, blurred background, brand + org switcher
 * + primary nav + user menu trigger.
 *
 * Server component. The user menu trigger is a placeholder Button;
 * wire it to a DropdownMenu once that component is added to
 * packages/ui (see project-shadcn-monorepo-bootstrap-plan).
 */

export type AppHeaderNavItem = {
  label: string
  href: string
  /** Marks the current page — applies aria-current="page". */
  active?: boolean
}

export type AppHeaderUser = {
  name: string
  email: string
  /** Reserved — avatars land once the storage provider ships in M2. */
  avatarUrl?: string
}

export type AppHeaderProps = {
  user: AppHeaderUser
  /** When set, renders the org switcher to the right of the brand. */
  orgName?: string
  /** Primary nav. Hidden on mobile until a hamburger lands. */
  navItems?: AppHeaderNavItem[]
  className?: string
}

function initialsOf(name: string): string {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("")
}

const ChevronDown = (props: React.SVGProps<SVGSVGElement>) => (
  <svg
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    strokeWidth="1.75"
    strokeLinecap="round"
    strokeLinejoin="round"
    aria-hidden="true"
    {...props}
  >
    <path d="M6 9l6 6 6-6" />
  </svg>
)

export function AppHeader({
  user,
  orgName,
  navItems = [],
  className,
}: AppHeaderProps) {
  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b border-border bg-background/80 backdrop-blur supports-[backdrop-filter]:bg-background/60",
        className,
      )}
    >
      <div className="mx-auto flex h-14 max-w-screen-2xl items-center gap-4 px-4 sm:px-6">
        {/* Brand */}
        <Link
          href="/"
          aria-label="DeesseJS — home"
          className="flex shrink-0 items-center gap-2 text-base font-semibold tracking-tight text-foreground"
        >
          <span
            aria-hidden="true"
            className="flex size-6 items-center justify-center rounded-md bg-primary text-[11px] font-bold text-primary-foreground"
          >
            D
          </span>
          <span>DeesseJS</span>
        </Link>

        {/* Org switcher */}
        {orgName ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="hidden max-w-[12rem] gap-1.5 md:inline-flex"
            aria-label={`Switch organisation — currently ${orgName}`}
          >
            <span className="truncate">{orgName}</span>
            <ChevronDown className="size-3.5 opacity-60" />
          </Button>
        ) : null}

        {/* Primary nav (md+) */}
        {navItems.length > 0 ? (
          <nav
            aria-label="Primary"
            className="hidden flex-1 items-center gap-1 md:flex"
          >
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                aria-current={item.active ? "page" : undefined}
                className={cn(
                  "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                  item.active
                    ? "bg-muted text-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                {item.label}
              </Link>
            ))}
          </nav>
        ) : (
          <div className="hidden flex-1 md:block" aria-hidden="true" />
        )}

        {/* Spacer on mobile (pushes user menu right) */}
        <div className="flex-1 md:hidden" aria-hidden="true" />

        {/* User menu trigger (placeholder until DropdownMenu lands) */}
        <div className="flex shrink-0 items-center gap-2">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-2 px-1.5"
            aria-label={`Account menu for ${user.name}`}
          >
            <span
              aria-hidden="true"
              className="flex size-7 items-center justify-center rounded-full bg-muted text-xs font-semibold text-foreground"
            >
              {initialsOf(user.name)}
            </span>
            <span className="hidden text-sm font-medium md:inline">
              {user.name}
            </span>
            <ChevronDown className="hidden size-3.5 opacity-60 md:inline-block" />
          </Button>
        </div>
      </div>
    </header>
  )
}
