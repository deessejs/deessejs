"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Boxes,
  CreditCard,
  Database,
  KeyRound,
  Mail,
  Radio,
  ShieldCheck,
  Wrench,
  type LucideIcon,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import { EcosystemCodeMockup } from "@/app/(marketing)/_components/ecosystem-code-mockup"
import { DotGrid } from "@/app/(marketing)/_components/dot-grid"

/**
 * Tabbed view of four saas-apps pillars, used twice on
 * `/use-cases/saas-apps` to render the eight pillars as a
 * mirrored 4+4 (customer surface + behind the curtain).
 *
 * Layout: same 2-col CSS grid as `<EcosystemTabs>` and
 * `<CliStartTabs>`:
 *   - On lg+ the panel is
 *     `grid-cols-[minmax(320px,28rem)_1fr]`.
 *     Cards stack on one side (clamped 320px-28rem), the code
 *     mockup occupies the other side.
 *   - Below lg the grid collapses to a single column; cards
 *     stack on top, mockup below.
 *   - The mockup is anchored to the column's far edge and
 *     translated 25% along that axis + 25% down, so the visible
 *     portion sits in the far corner with margin in the
 *     near corner. Same margin-break pattern as SurfacesTabs and
 *     EcosystemTabs.
 *
 * Two-axis flip via the `reverse` prop:
 *   - reverse=false (default) : tabs LEFT, mockup RIGHT. The
 *     mockup is anchored bottom-right and translated right
 *     +25% / down +25%.
 *   - reverse=true            : tabs RIGHT, mockup LEFT. The
 *     mockup is anchored bottom-left and translated left
 *     -25% / down +25%; the TabsList picks up a left border
 *     instead of a right border.
 *
 * The flip is CSS-only (`lg:[&>*:first-child]:order-2` on the
 * Tabs root) so the markup stays a single source of truth.
 * `<EcosystemCodeMockup>` and `<DotGrid>` are reused without
 * modification - the mockup is `slug: string` typed here (not
 * the EcosystemSlug union) so the eight saas slugs drop in.
 *
 * Per-pillar cards on the visible side are TabsTriggers
 * (icon + title + description + "Read the pillar" link). The
 * active card picks up `bg-accent/40`.
 *
 * Pre-rendered Shiki HTML travels through the boundary as
 * plain strings (`htmlBySlug`) because Next 16 forbids async
 * Server Components as children of Client Components.
 */

/**
 * Icon registry keyed by string name. The server-rendered page
 * passes `iconName: "KeyRound"` etc. through the boundary; this
 * Client Component resolves the name to a real lucide component
 * without ever trying to serialise a React element across the
 * Server->Client boundary (which Next 16 forbids).
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Boxes,
  CreditCard,
  Database,
  KeyRound,
  Mail,
  Radio,
  ShieldCheck,
  Wrench,
}

export type SaasPillarTab = {
  slug: string
  title: string
  description: string
  iconName: string
}

export function SaasPillarsTabs({
  pillars,
  htmlBySlug,
  reverse = false,
  className,
}: {
  pillars: ReadonlyArray<SaasPillarTab>
  htmlBySlug: Record<string, { tabName: string; html: string }[]>
  reverse?: boolean
  className?: string
}) {
  const firstSlug = pillars[0]?.slug ?? "auth"

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className={cn(
        "grid grid-cols-1 lg:grid-cols-[minmax(320px,28rem)_1fr]",
        reverse && "lg:[&>*:first-child]:order-2",
        className,
      )}
    >
      <TabsList
        aria-label="Pillars"
        className={cn(
          "flex flex-col divide-y divide-border border-b border-border bg-transparent p-0 h-auto w-full rounded-none!",
          reverse ? "lg:border-b-0 lg:border-l" : "lg:border-b-0 lg:border-r",
        )}
      >
        {pillars.map((tab) => {
          const Icon = ICON_REGISTRY[tab.iconName]
          return (
            <TabsTrigger
              key={tab.slug}
              value={tab.slug}
              className={cn(
                "group flex flex-col items-start gap-2 rounded-none bg-transparent p-6 text-left h-auto w-full shadow-none border-0",
                "text-foreground/60 hover:text-foreground hover:bg-accent/40",
                "data-[state=active]:bg-accent/40 data-[state=active]:text-foreground",
                "[&:after]:hidden",
              )}
            >
              <div className="flex w-full items-center gap-2">
                {Icon ? (
                  <Icon
                    className="text-foreground size-4 shrink-0"
                    aria-hidden
                  />
                ) : null}
                <h3 className="text-heading-20 tracking-tight !m-0 truncate">
                  {tab.title}
                </h3>
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {tab.description}
              </p>
              <Link
                href={`#pillar-${tab.slug}`}
                className="inline-flex items-center gap-1 text-label-13 text-foreground hover:underline underline-offset-4 pt-1"
                onClick={(event) => event.stopPropagation()}
              >
                Read the pillar
                <ArrowRight className="size-3" aria-hidden />
              </Link>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {pillars.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          <DotGrid className="absolute inset-0" />
          <div
            className={cn(
              "absolute bottom-0 h-[110%] w-[110%] translate-y-[25%] overflow-hidden",
              reverse
                ? "left-0 -translate-x-[25%]"
                : "right-0 translate-x-[25%]",
            )}
          >
            <EcosystemCodeMockup
              slug={tab.slug}
              files={htmlBySlug[tab.slug] ?? []}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
