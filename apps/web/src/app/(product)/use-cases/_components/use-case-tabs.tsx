"use client"

import * as React from "react"
import Link from "next/link"
import {
  ArrowRight,
  Activity,
  Bell,
  BellRing,
  Boxes,
  CreditCard,
  Database,
  FileCode,
  GitBranch,
  KeyRound,
  Layers,
  LineChart,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Wrench,
  Workflow,
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
 * Tabbed view of four use-case pillars, used twice on every
 * `/use-cases/{slug}` page to render the 8 pillars as a
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
 * The flip is wired via explicit grid placement on both the
 * TabsList and the TabsContent (Radix's auto-flow otherwise
 * leaves both children in column 1 when reverse is true).
 * `<EcosystemCodeMockup>` and `<DotGrid>` are reused without
 * modification - the mockup is `slug: string` typed so any
 * use-case pillar slug drops in.
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
 *
 * The 22 entries cover every icon name the 7 use-case pages
 * (saas-apps, ai-products, api-backends, internal-tools,
 * mobile-backend, open-source, landing-pages) reference across
 * their 8 pillars. Add new entries here as the pillar list
 * grows.
 */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Activity,
  Bell,
  BellRing,
  Boxes,
  CreditCard,
  Database,
  FileCode,
  GitBranch,
  KeyRound,
  Layers,
  LineChart,
  Lock,
  Mail,
  MessageSquare,
  Package,
  Radio,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  Users,
  Workflow,
  Wrench,
}

export type UseCaseTab = {
  slug: string
  title: string
  description: string
  iconName: string
}

export function UseCaseTabs({
  pillars,
  htmlBySlug,
  reverse = false,
  className,
}: {
  pillars: ReadonlyArray<UseCaseTab>
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
        className,
      )}
    >
      <TabsList
        aria-label="Pillars"
        className={cn(
          // Radix's TabsList is inline-flex by default, which would
          // let the grid auto-place it on lg+ and break the
          // 28rem / 1fr split. Force it into the leftmost (default)
          // or rightmost (reverse) column at lg+ via explicit grid
          // placement. The border swaps sides to match.
          "flex flex-col divide-y divide-border border-b border-border bg-transparent p-0 h-auto w-full rounded-none!",
          reverse
            ? "lg:border-b-0 lg:border-l lg:col-start-2 lg:row-start-1"
            : "lg:border-b-0 lg:border-r lg:col-start-1 lg:row-start-1",
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
          // Place the active content panel in column 2 by default
          // (mockup on the right). When `reverse`, swap to column 1
          // so the mockup lives on the left side instead.
          className={cn(
            "relative outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden",
            reverse
              ? "lg:col-start-1 lg:row-start-1"
              : "lg:col-start-2 lg:row-start-1",
          )}
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
