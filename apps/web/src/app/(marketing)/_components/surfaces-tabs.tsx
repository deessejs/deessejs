"use client"

import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  Layers,
  MonitorSmartphone,
  Sparkles,
  type LucideIcon,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

/**
 * Tabbed view of the four core surfaces in the registry: SaaS, AI
 * agents, Mobile, Desktop. Each surface is rendered as a vertical
 * card on the left (title + description + "Learn more" link), and
 * the right-hand column swaps the placeholder illustration to match
 * the active surface.
 *
 * Layout:
 *   • All four cards are always visible on the left, stacked
 *     vertically and separated by `divide-y`. The active card picks
 *     up a subtle bg (`bg-accent/40`) to mirror the shared-border
 *     "selected" convention used elsewhere on the page.
 *   • The right column shows the placeholder for the active surface
 *     only. On lg+, the panel is a 2-col grid (cards on the left,
 *     placeholder on the right). Below lg, it stacks.
 *
 * The placeholder mirrors the hero's media placeholder (lighter grey
 * background + radial dot overlay). Real per-surface mockups are not
 * in scope yet — this component is wired so each tab already drives
 * a distinct block, so dropping a real illustration in only requires
 * swapping the right-hand div content per tab value.
 */

type SurfaceTab = {
  slug: string
  name: string
  description: string
  href: string
  icon: LucideIcon
}

const SURFACE_TABS: ReadonlyArray<SurfaceTab> = [
  {
    slug: "saas",
    name: "SaaS",
    description:
      "Multi-tenant B2B apps with auth, billing, and orgs wired from day one.",
    href: "/templates?surface=saas",
    icon: Layers,
  },
  {
    slug: "ai-agents",
    name: "AI agents",
    description:
      "Streaming chat endpoints, typed tools, and agent persistence out of the box.",
    href: "/templates?surface=ai-agents",
    icon: Sparkles,
  },
  {
    slug: "mobile",
    name: "Mobile",
    description:
      "React Native + Expo with the same contracts as the web stack.",
    href: "/templates?surface=mobile",
    icon: MonitorSmartphone,
  },
  {
    slug: "desktop",
    name: "Desktop",
    description:
      "Electron or Tauri shells wired against the shared backend.",
    href: "/templates?surface=desktop",
    icon: Boxes,
  },
]

export function SurfacesTabs() {
  const firstSlug = SURFACE_TABS[0]?.slug ?? "saas"

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className="flex flex-col lg:flex-row"
    >
      <TabsList
        aria-label="Surfaces"
        className="flex flex-col divide-y divide-border border-b border-border lg:border-b-0 lg:border-r bg-transparent p-0 h-auto w-full lg:w-auto lg:min-w-[320px] lg:max-w-md"
      >
        {SURFACE_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.slug}
              value={tab.slug}
              className="group flex flex-col items-start gap-2 rounded-none bg-transparent p-6 text-left h-auto w-full shadow-none border-0
                text-foreground/60 hover:text-foreground hover:bg-accent/40
                data-[state=active]:bg-accent/40 data-[state=active]:text-foreground
                [&:after]:hidden"
            >
              <div className="flex items-center gap-2">
                <Icon
                  className="text-foreground size-4 shrink-0"
                  aria-hidden
                />
                <h3 className="text-heading-20 tracking-tight !m-0">{tab.name}</h3>
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {tab.description}
              </p>
              <Link
                href={tab.href}
                className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 pt-1"
                onClick={(event) => event.stopPropagation()}
              >
                Learn more
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {SURFACE_TABS.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative flex-1 outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          {/* Right column: placeholder mockup, anchored to the
              bottom-right and translated 25% right + 25% down so the
              top-left of the mockup is offset, leaving a visible
              margin in the upper-left of the column. The parent
              TabsContent has overflow-hidden so the displaced mockup
              is clipped by the column edges. */}
          <div
            aria-hidden
            className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%] bg-muted/40 border border-border overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
