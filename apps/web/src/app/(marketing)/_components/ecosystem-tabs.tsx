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
 * The `<EcosystemCodeMockup>` rendered inside each TabsContent is a
 * Server Component (async, calls `shiki` server-side); React renders
 * it as a child of this Client Component via the standard RSC
 * composition pattern, so the highlighted HTML streams at request
 * time and `shiki` never enters the client bundle.
 */

type EcosystemTab = {
  slug: EcosystemSlug
  name: string
  description: string
  href: string
  icon: LucideIcon
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
  },
  {
    slug: "collections",
    name: "Collections",
    description:
      "Type-safe data access with end-to-end inference. The schema is the source of truth, from the database to the client component.",
    href: "https://collections.deessejs.com",
    icon: ListTree,
  },
]

export function EcosystemTabs() {
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
                target="_blank"
                rel="noopener noreferrer"
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

      {ECOSYSTEM_TABS.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative flex-1 outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          {/* Mockup anchored to the bottom-right and translated 25%
              right + 25% down so the visible portion sits in the
              bottom-right corner with margin in the upper-left. Mirrors
              the SurfacesTabs pattern. */}
          <div className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%]">
            <EcosystemCodeMockup slug={tab.slug} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
