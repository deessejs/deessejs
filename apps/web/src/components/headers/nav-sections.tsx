"use client"

import Link from "next/link"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu"
import { cn } from "@workspace/ui/lib/utils"

type NavItem = {
  label: string
  href: string
  description?: string
  external?: boolean
}

/** A vertical category inside a section dropdown (header + stacked items). */
type NavCategory = {
  /** Short uppercase-ish label shown above the items (Learn, Use Cases, ...). */
  label: string
  items: ReadonlyArray<NavItem>
}

type NavSection = {
  label: string
  /** Top-level href used when the section has no dropdown (Pricing, Enterprise). */
  href?: string
  /** Vertical categories shown inside the dropdown. */
  categories?: ReadonlyArray<NavCategory>
}

/**
 * Single source of truth for the marketing site nav. Both the desktop
 * NavigationMenu (Radix) and the mobile Sheet read from this list.
 *
 * Categories mirror the pattern at vercel.com: a top-level section
 * opens a dropdown with vertical category headers (Learn / Use Cases /
 * Explore, Templates / Ecosystem / Surface). Enterprise and Pricing are
 * plain links because they have a single destination.
 */
const NAV_SECTIONS: ReadonlyArray<NavSection> = [
  {
    label: "Products",
    categories: [
      {
        label: "Templates",
        items: [
          {
            label: "Browse templates",
            href: "/templates",
            description: "The full catalog, installable from the CLI",
          },
          {
            label: "CLI",
            href: "/cli",
            description: "npx deessejs init / list / info",
          },
        ],
      },
      {
        label: "Ecosystem",
        items: [
          {
            label: "Errors",
            href: "https://errors.deessejs.com",
            description: "Structured error tracking",
            external: true,
          },
          {
            label: "DRPC",
            href: "https://drpc.deessejs.com",
            description: "Durable RPC for agent workflows",
            external: true,
          },
          {
            label: "Collections",
            href: "https://collections.deessejs.com",
            description: "Type-safe data access",
            external: true,
          },
          {
            label: "FP",
            href: "https://fp.deessejs.com",
            description: "Functional primitives",
            external: true,
          },
        ],
      },
      {
        label: "DeesseJS surface",
        items: [
          {
            label: "UI",
            href: "https://ui.deessejs.com",
            description: "Component library",
            external: true,
          },
          {
            label: "Admin",
            href: "https://admin.deessejs.com",
            description: "Operator console",
            external: true,
          },
          {
            label: "Cloud",
            href: "https://cloud.deessejs.com",
            description: "Hosted runtime, coming soon",
            external: true,
          },
        ],
      },
    ],
  },
  {
    label: "Resources",
    categories: [
      {
        label: "Learn",
        items: [
          {
            label: "Docs",
            href: "https://docs.deessejs.com",
            description: "The full DeesseJS reference",
            external: true,
          },
          {
            label: "Blog",
            href: "/blog",
            description: "Posts and announcements",
          },
          {
            label: "Changelog",
            href: "/changelog",
            description: "Release notes and version history",
          },
          {
            label: "Knowledge Base",
            href: "/knowledge-base",
            description: "How-tos and reference material",
          },
        ],
      },
      {
        label: "Use cases",
        items: [
          {
            label: "SaaS apps",
            href: "/use-cases/saas-apps",
            description:
              "Multi-tenant B2B SaaS with auth, billing, and a working dashboard on day one",
          },
          {
            label: "AI products",
            href: "/use-cases/ai-products",
            description:
              "RAG, chat, and agents wired against the same contracts your app uses",
          },
          {
            label: "Landing pages",
            href: "/use-cases/landing-pages",
            description:
              "High-converting marketing surfaces, tuned for the B2B SaaS shelf",
          },
        ],
      },
      {
        label: "Explore",
        items: [
          {
            label: "Customers",
            href: "/customers",
            description: "Who builds on DeesseJS",
          },
          {
            label: "Templates",
            href: "/templates",
            description: "The full template catalog",
          },
          {
            label: "Ecosystem",
            href: "/ecosystem",
            description: "The apps, SDKs, and contracts that ship together",
          },
        ],
      },
    ],
  },
  {
    label: "Enterprise",
    href: "/enterprise",
  },
  {
    label: "Pricing",
    href: "/pricing",
  },
]

export const isNavActive = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

const externalProps = (external?: boolean) =>
  external
    ? { target: "_blank" as const, rel: "noopener noreferrer" as const }
    : {}

/**
 * Renders the marketing site nav tree. `variant` selects between the
 * Radix NavigationMenu (desktop, with dropdowns) and a flat nested
 * stack (mobile, used inside the Sheet). The active-link state is
 * passed in from the parent (which has `usePathname()`) because
 * NavSections is rendered inside SiteHeader.
 */
export function NavSections({
  pathname,
  variant,
}: {
  pathname: string
  variant: "desktop" | "mobile"
}) {
  if (variant === "desktop") {
    return (
      <NavigationMenu viewport={true} aria-label="Primary">
        <NavigationMenuList>
          {NAV_SECTIONS.map((section) =>
            section.categories ? (
              <DesktopDropdown key={section.label} section={section} />
            ) : (
              <DesktopLink
                key={section.label}
                section={section}
                pathname={pathname}
              />
            ),
          )}
        </NavigationMenuList>
      </NavigationMenu>
    )
  }

  return (
    <nav aria-label="Primary mobile" className="flex flex-col gap-5">
      {NAV_SECTIONS.map((section) => (
        <div key={section.label} className="flex flex-col gap-2">
          {section.href ? (
            <Link
              href={section.href}
              className={cn(
                "text-sm font-medium",
                isNavActive(pathname, section.href)
                  ? "text-foreground"
                  : "text-muted-foreground",
              )}
            >
              {section.label}
            </Link>
          ) : (
            <span className="text-sm font-medium text-muted-foreground">
              {section.label}
            </span>
          )}
          {section.categories ? (
            <div className="flex flex-col gap-4 pl-2">
              {section.categories.map((category) => (
                <div
                  key={category.label}
                  className="flex flex-col gap-1.5"
                >
                  <span className="text-label-13 font-semibold uppercase tracking-wider text-muted-foreground">
                    {category.label}
                  </span>
                  <ul className="flex flex-col gap-1.5 pl-2">
                    {category.items.map((item) => (
                      <li key={item.label}>
                        <Link
                          href={item.href}
                          className="text-sm text-foreground transition-colors hover:text-foreground/70"
                          {...externalProps(item.external)}
                        >
                          {item.label}
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          ) : null}
        </div>
      ))}
    </nav>
  )
}

/** Plain top-level link for sections without a dropdown. */
function DesktopLink({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string
}) {
  const active = section.href ? isNavActive(pathname, section.href) : false
  return (
    <NavigationMenuItem>
      {/*
       * Plain Link inside the NavigationMenuItem, sized via
       * navigationMenuTriggerStyle() so it lines up with the
       * NavigationMenuTrigger siblings. We don't use
       * NavigationMenuLink here because Radix's primitive carries
       * its own `data-[active=true]:text-accent-foreground` style
       * that wins specificity battles against `text-muted-foreground`
       * and flips the colour on the active route.
       */}
      <Link
        href={section.href ?? "#"}
        className={cn(
          navigationMenuTriggerStyle(),
          "px-2.5",
          "text-muted-foreground hover:text-foreground focus-visible:text-foreground",
          active && "text-foreground",
        )}
      >
        {section.label}
      </Link>
    </NavigationMenuItem>
  )
}

/** Section with a multi-column dropdown panel grouped by vertical categories. */
function DesktopDropdown({ section }: { section: NavSection }) {
  const columnCount = section.categories?.length ?? 1
  // Wider panel when there are more columns.
  const widthClass =
    columnCount >= 3 ? "w-[640px]" : columnCount === 2 ? "w-[480px]" : "w-[280px]"

  return (
    <NavigationMenuItem>
      <NavigationMenuTrigger
        className={cn(
          navigationMenuTriggerStyle(),
          "px-2.5",
          "text-muted-foreground hover:text-foreground data-[state=open]:text-foreground",
        )}
      >
        {section.label}
      </NavigationMenuTrigger>
      <NavigationMenuContent>
        <div className={cn("grid gap-6 p-4", widthClass)}>
          <ul
            className={cn(
              "grid gap-6",
              columnCount === 1 && "grid-cols-1",
              columnCount === 2 && "grid-cols-2",
              columnCount >= 3 && "grid-cols-3",
            )}
          >
            {section.categories?.map((category) => (
              <li key={category.label}>
                <DesktopCategoryColumn category={category} />
              </li>
            ))}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

/** Single category column inside the desktop dropdown. */
function DesktopCategoryColumn({ category }: { category: NavCategory }) {
  return (
    <div className="flex flex-col gap-2">
      <span className="text-label-13 font-semibold uppercase tracking-wider text-muted-foreground">
        {category.label}
      </span>
      <ul className="flex flex-col gap-1">
        {category.items.map((item) => (
          <li key={item.label}>
            <NavigationMenuLink asChild>
              <Link
                href={item.href}
                className="text-foreground hover:bg-accent hover:text-accent-foreground focus-visible:bg-accent focus-visible:text-accent-foreground"
                {...externalProps(item.external)}
              >
                <span className="text-sm font-medium">{item.label}</span>
                {item.description ? (
                  <span className="text-xs text-muted-foreground group-hover:text-accent-foreground/80">
                    {item.description}
                  </span>
                ) : null}
              </Link>
            </NavigationMenuLink>
          </li>
        ))}
      </ul>
    </div>
  )
}
