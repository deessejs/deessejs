"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { Menu } from "lucide-react"
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "@workspace/ui/components/navigation-menu"
import { Button } from "@workspace/ui/components/button"
import { Sheet, SheetContent, SheetTrigger } from "@workspace/ui/components/sheet"
import { APP_NAME } from "@workspace/ui/lib/config"
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
 * Top-level navigation for the marketing site. Four sections, matching the
 * pattern at vercel.com: Products, Resources, Enterprise, Pricing. Sections
 * with categories open a Radix NavigationMenu panel grouped by vertical
 * category headers (Learn / Use Cases / Explore, Templates / Ecosystem);
 * Enterprise and Pricing are plain links (one destination each).
 *
 * Sub-domain packages mirror what /ecosystem lists (errors, drpc,
 * collections, fp, ui, type-testing). Their hrefs point at the
 * sub-domain sites, marked `external`.
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
] as const

const isActive = (pathname: string, href: string): boolean => {
  if (href === "/") return pathname === "/"
  return pathname === href || pathname.startsWith(`${href}/`)
}

/** Plain top-level link used for sections without a dropdown. */
function SectionLink({
  section,
  pathname,
}: {
  section: NavSection
  pathname: string
}) {
  const active = section.href ? isActive(pathname, section.href) : false
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

/** Single category column: header + stacked items. */
function CategoryColumn({ category }: { category: NavCategory }) {
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
                {...(item.external
                  ? { target: "_blank", rel: "noopener noreferrer" }
                  : {})}
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

/** Section with a multi-column dropdown panel grouped by vertical categories. */
function SectionWithCategories({ section }: { section: NavSection }) {
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
                <CategoryColumn category={category} />
              </li>
            ))}
          </ul>
        </div>
      </NavigationMenuContent>
    </NavigationMenuItem>
  )
}

function DesktopNav({ pathname }: { pathname: string }) {
  return (
    <NavigationMenu
      viewport={true}
      className="hidden sm:flex"
      aria-label="Primary"
    >
      <NavigationMenuList>
        {NAV_SECTIONS.map((section) =>
          section.categories ? (
            <SectionWithCategories key={section.label} section={section} />
          ) : (
            <SectionLink
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

function MobileNav({ pathname }: { pathname: string }) {
  return (
    <Sheet>
      <SheetTrigger
        asChild
        className="sm:hidden"
      >
        <Button
          variant="ghost"
          size="icon"
          aria-label="Open navigation menu"
        >
          <Menu className="size-5" />
        </Button>
      </SheetTrigger>
      <SheetContent
        side="left"
        className="flex w-72 flex-col gap-6 p-6"
      >
        <Link href="/" className="font-semibold text-lg">
          {APP_NAME}
        </Link>
        <nav aria-label="Primary mobile" className="flex flex-col gap-5">
          {NAV_SECTIONS.map((section) => (
            <div key={section.label} className="flex flex-col gap-2">
              {section.href ? (
                <Link
                  href={section.href}
                  className={cn(
                    "text-sm font-medium",
                    isActive(pathname, section.href)
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
                    <div key={category.label} className="flex flex-col gap-1.5">
                      <span className="text-label-13 font-semibold uppercase tracking-wider text-muted-foreground">
                        {category.label}
                      </span>
                      <ul className="flex flex-col gap-1.5 pl-2">
                        {category.items.map((item) => (
                          <li key={item.label}>
                            <Link
                              href={item.href}
                              className="text-sm text-foreground transition-colors hover:text-foreground/70"
                              {...(item.external
                                ? {
                                    target: "_blank",
                                    rel: "noopener noreferrer",
                                  }
                                : {})}
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
        <div className="mt-auto flex flex-col gap-2">
          <Button disabled className="w-full">
            Coming soon
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}

/**
 * Marketing site header. Sticky with a solid `bg-background` (no
 * opacity, no backdrop blur). Desktop uses the shadcn NavigationMenu
 * primitive (Radix) for the four top-level sections; mobile collapses
 * into a Sheet with categories rendered as nested groups.
 *
 * Auth state: the marketing site does not currently expose a
 * client-side session, so the right-side CTA stays as a disabled
 * "Coming soon". When the client session is wired, the desktop
 * right-side button can be replaced by an avatar dropdown without
 * changing the public URL surface.
 */
export function SiteHeader() {
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-40 border-b bg-background">
      <div className="mx-auto flex h-14 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <MobileNav pathname={pathname} />
          <Link
            href="/"
            className="font-semibold text-lg"
            aria-label={`${APP_NAME} home`}
          >
            {APP_NAME}
          </Link>
          <DesktopNav pathname={pathname} />
        </div>

        <div className="hidden items-center gap-2 sm:flex">
          <Button disabled>Coming soon</Button>
        </div>
      </div>
    </header>
  )
}
