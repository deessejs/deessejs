"use client"

import Link from "next/link"
import {
  AlertTriangle,
  ArrowRight,
  ListTree,
  Radio,
  Sigma,
  type LucideIcon,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import { EcosystemCodeMockup } from "./ecosystem-code-mockup"
import type { EcosystemSlug } from "./ecosystem-snippets"

/**
 * Tabbed view of the four ecosystem tools: Errors, FP, DRPC,
 * Collections. Mirrors `<SurfacesTabs>` but mirrored horizontally —
 * the code mockup sits on the LEFT (wider column) and the four
 * product cards stack on the RIGHT.
 *
 * Layout:
 *   • On lg+, the panel is a 2-col grid with the mockup on the
 *     left (1.32fr) and the cards on the right (0.68fr). Below lg, the
 *     panel stacks vertically: mockup on top, cards beneath.
 *   • The mockup is anchored to the bottom-right and translated
 *     25% right + 25% down so the visible portion sits in the
 *     bottom-right corner with margin in the upper-left — the same
 *     margin-break pattern as SurfacesTabs.
 *
 * Per-product cards on the right are tab triggers (all visible). The
 * active card picks up `bg-accent/40`.
 *
 * The four mockups are pre-rendered server-side by the parent
 * `<Ecosystem>` Server Component (which calls `shiki.codeToHtml` once
 * per snippet) and passed in via the `htmlBySlug` prop. This is
 * required by Next 16: a Client Component cannot render an async
 * Server Component as a child, so the highlighted HTML must travel
 * through the boundary as plain strings instead of as a rendered
 * subtree.
 */

type EcosystemTab = {
  slug: EcosystemSlug
  name: string
  description: string
  href: string
  icon: LucideIcon
  /**
   * When true, the card stays in the list to honour the "four tools"
   * promise but renders as a passive state: a "Coming soon" pill
   * next to the title, the TabsTrigger is disabled (Radix's primitive
   * + shadcn CSS handle `disabled:pointer-events-none opacity-50`),
   * and the "Learn more" CTA becomes a muted "Coming soon" label
   * instead of an external link. Today: only Errors and FP ship;
   * DRPC and Collections light up once their respective packages ship.
   */
  comingSoon?: boolean
}

const ECOSYSTEM_TABS: ReadonlyArray<EcosystemTab> = [
  {
    slug: "errors",
    name: "Errors",
    description:
      "Structured error tracking with full TypeScript context. Stack traces, breadcrumbs, and source maps wired into the same contracts your templates use.",
    href: "https://errors.deessejs.com",
    icon: AlertTriangle,
  },
  {
    slug: "fp",
    name: "FP",
    description:
      "Functional primitives for TypeScript. Pipes, options, results, and tasks, designed to keep the contracts readable under load.",
    href: "https://fp.deessejs.com",
    icon: Sigma,
  },
  {
    slug: "drpc",
    name: "DRPC",
    description:
      "Durable RPC for agent workflows. Long-running calls that survive restarts, with retries and replay built in.",
    href: "https://drpc.deessejs.com",
    icon: Radio,
    comingSoon: true,
  },
  {
    slug: "collections",
    name: "Collections",
    description:
      "Type-safe data access with end-to-end inference. The schema is the source of truth, from the database to the client component.",
    href: "https://collections.deessejs.com",
    icon: ListTree,
    comingSoon: true,
  },
]

export function EcosystemTabs({
  htmlBySlug,
}: {
  /** Pre-highlighted HTML for each tab's code mockup, keyed by slug. */
  htmlBySlug: Record<EcosystemSlug, string>
}) {
  const firstSlug = ECOSYSTEM_TABS[0]?.slug ?? "errors"

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className="flex flex-col lg:flex-row"
    >
      <TabsList
        aria-label="Ecosystem"
        className="flex flex-col divide-y divide-border border-b border-border lg:border-b-0 lg:border-r bg-transparent p-0 h-auto w-full lg:w-auto lg:min-w-[320px] lg:max-w-md"
      >
        {ECOSYSTEM_TABS.map((tab) => {
          const Icon = tab.icon
          return (
            <TabsTrigger
              key={tab.slug}
              value={tab.slug}
              disabled={tab.comingSoon}
              aria-disabled={tab.comingSoon || undefined}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-none bg-transparent p-6 text-left h-auto w-full shadow-none border-0",
                "text-foreground/60 hover:text-foreground hover:bg-accent/40",
                "data-[state=active]:bg-accent/40 data-[state=active]:text-foreground",
                "[&:after]:hidden",
                tab.comingSoon &&
                  "opacity-60 cursor-not-allowed hover:bg-transparent hover:text-foreground/60",
              )}
            >
              <div className="flex w-full items-start justify-between gap-2">
                <div className="flex items-center gap-2 min-w-0">
                  <Icon
                    className="text-foreground size-4 shrink-0"
                    aria-hidden
                  />
                  <h3 className="text-heading-20 tracking-tight !m-0 truncate">
                    {tab.name}
                  </h3>
                </div>
                {tab.comingSoon ? (
                  <span
                    aria-label={`${tab.name} is coming soon`}
                    className="shrink-0 uppercase tracking-wider font-mono text-[10px] leading-[1.6] text-muted-foreground border border-border rounded-full px-2 py-0.5"
                  >
                    Coming soon
                  </span>
                ) : null}
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {tab.description}
              </p>
              {tab.comingSoon ? (
                <span className="inline-flex items-center gap-1 text-label-13 text-muted-foreground/60 pt-1">
                  Coming soon
                </span>
              ) : (
                <Link
                  href={tab.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 pt-1"
                  onClick={(event) => event.stopPropagation()}
                >
                  Learn more
                  <ArrowRight className="size-3" aria-hidden />
                </Link>
              )}
            </TabsTrigger>
          )
        })}
      </TabsList>

      {ECOSYSTEM_TABS.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative flex-1 outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          {/* Right-column background canvas: a textured
              `bg-muted/40` panel with a dotted overlay, sized to
              the whole TabsContent (no translate, no peek) so it
              reads as the backdrop for the right-hand column. The
              code mockup is layered on top of this canvas below. */}
          <div
            aria-hidden
            className="absolute inset-0 bg-muted/40 overflow-hidden"
          >
            <div className="absolute inset-0 bg-[radial-gradient(circle,var(--border)_1px,transparent_1px)] bg-size-[12px_12px] opacity-60" />
          </div>
          {/* Code mockup anchored to the bottom-right and translated
              25% right + 25% down so the top-left of the mockup is
              offset from the visible cell, leaving a peek margin in
              the upper-left corner of the column. The TabsContent
              parent carries `overflow-hidden` so the displaced
              wrapper is clipped by the column edges — same recipe
              as <SurfacesTabs>. */}
          <div className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%] overflow-hidden">
            <div className="absolute top-[12%] left-[12%] right-[12%] bottom-[12%]">
              <EcosystemCodeMockup
                slug={tab.slug}
                tabName={`${tab.slug}.ts`}
                html={htmlBySlug[tab.slug]}
              />
            </div>
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
