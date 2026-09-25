"use client"

import * as React from "react"
import {
  ArrowRight,
  Bell,
  CreditCard,
  Database,
  Layers,
  LineChart,
  Lock,
  type LucideIcon,
  Workflow,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Cluster-driven capabilities section for use-case pages.
 *
 * The capabilities ship in 4 thematic clusters (Auth & identity,
 * Billing & growth, Operator console, Background work), not as
 * 8 flat cards. Each cluster owns 3-4 capability rows with a short
 * paragraph that says what the buyer actually gets — not just a
 * feature label.
 *
 * Layout mirrors <SurfacesTabs>: every cluster card visible at once
 * on the left, the selected cluster drives the right-column panel.
 * Below the cluster list, a single "Open the registry →" CTA
 * pushes the visitor to action instead of leaving them staring
 * at the same list.
 *
 * Icon lookup is by **string** so the page can stay server-rendered
 * while the registry resolves to a lucide component on the client.
 */

/** Icon registry. Add new entries here as the cluster list grows. */
const ICON_REGISTRY: Record<string, LucideIcon> = {
  Bell,
  CreditCard,
  Database,
  Layers,
  LineChart,
  Lock,
  Workflow,
}

export type CapabilityRow = {
  /** Stable id, used for anchors if we ever add deep links. */
  id: string
  /** Short title shown in the row. Title case. */
  title: string
  /**
   * Selling copy — 2-3 sentences that say what the buyer gets and
   * what concrete shape it takes. Plain prose, no marketing fluff.
   */
  body: string
}

export type CapabilityCluster = {
  /** Cluster id, also used as the tab value. */
  id: string
  /** Lucide icon name. Resolved via ICON_REGISTRY below. */
  iconName: string
  /** Cluster title (e.g. "Auth & identity"). */
  title: string
  /** Cluster lead — the tenant-side question this cluster answers. */
  lead: string
  /** Cluster rows. */
  rows: ReadonlyArray<CapabilityRow>
}

export function CapabilityClustersSection({
  clusters,
  mockups,
  ctaHref = "/templates",
  ctaLabel = "Open the registry",
  className,
}: {
  clusters: ReadonlyArray<CapabilityCluster>
  /**
   * Map keyed by cluster.id → ReactNode (the cluster's mockup).
   * Clusters without a mockup fall back to a quiet "preview" panel
   * so the right column never reads as blank.
   */
  mockups: Record<string, React.ReactNode | undefined>
  ctaHref?: string
  ctaLabel?: string
  className?: string
}) {
  const first = clusters[0]
  if (!first) return null
  const firstSlug = first.id

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className={cn(
        "grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border",
        className,
      )}
    >
      <div className="flex flex-col">
        <TabsList
          aria-label="Capability clusters"
          className="flex flex-col divide-y divide-border border-0 bg-transparent p-0 h-auto w-full"
        >
          {clusters.map((cluster) => {
            const Icon = ICON_REGISTRY[cluster.iconName]
            return (
              <TabsTrigger
                key={cluster.id}
                value={cluster.id}
                className="group flex flex-col items-start gap-3 rounded-none bg-transparent p-6 lg:p-8 text-left h-auto w-full shadow-none border-0
                  text-foreground/80 hover:text-foreground hover:bg-accent/40
                  data-[state=active]:bg-accent/40 data-[state=active]:text-foreground
                  [&:after]:hidden"
              >
                <div className="flex items-center gap-2">
                  {Icon ? (
                    <Icon
                      className="text-foreground size-4 shrink-0"
                      aria-hidden
                    />
                  ) : null}
                  <h3 className="text-heading-24 tracking-tight !m-0">
                    {cluster.title}
                  </h3>
                </div>
                <p className="text-copy-16 text-muted-foreground leading-6 !m-0 max-w-2xl text-balance">
                  {cluster.lead}
                </p>
              </TabsTrigger>
            )
          })}
        </TabsList>

        <div className="flex items-center gap-2 border-t border-border p-6 lg:px-8 lg:py-6">
          <a
            href={ctaHref}
            className="inline-flex items-center gap-1 text-label-13 text-foreground underline-offset-4 hover:underline"
          >
            {ctaLabel}
            <ArrowRight className="size-3" aria-hidden />
          </a>
        </div>
      </div>

      <div className="flex flex-col">
        {clusters.map((cluster) => {
          const mockup = mockups[cluster.id]
          return (
            <TabsContent
              key={cluster.id}
              value={cluster.id}
              className="relative flex-1 outline-none mt-0 overflow-hidden"
              forceMount
              hidden={undefined}
            >
              <ClusterPanel
                cluster={cluster}
                mockup={mockup}
              />
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}

/**
 * Right-column content. Renders the capability rows on top and the
 * mockup in a macOS-style chrome at the bottom.
 */
function ClusterPanel({
  cluster,
  mockup,
}: {
  cluster: CapabilityCluster
  mockup: React.ReactNode | undefined
}) {
  return (
    <div className="flex h-full flex-col">
      <div className="flex flex-col divide-y divide-border border-b border-border">
        {cluster.rows.map((row) => (
          <div
            key={row.id}
            className="flex flex-col gap-2 p-6 lg:p-8"
          >
            <h4 className="text-heading-20 tracking-tight text-foreground">
              {row.title}
            </h4>
            <p className="max-w-2xl text-copy-16 text-foreground leading-7">
              {row.body}
            </p>
          </div>
        ))}
      </div>

      <div className="flex flex-1 items-stretch p-6 lg:p-8">
        <div className="flex w-full flex-col overflow-hidden rounded-md border border-border bg-background">
          <div className="flex items-center justify-start gap-2 border-b border-border bg-muted/40 px-4 py-3">
            <span aria-hidden className="block size-3 rounded-full bg-[#ff5f57]" />
            <span aria-hidden className="block size-3 rounded-full bg-[#febc2e]" />
            <span aria-hidden className="block size-3 rounded-full bg-[#28c840]" />
            <span className="ml-3 truncate font-mono text-label-12 text-muted-foreground">
              {cluster.id}
            </span>
          </div>
          <div className="flex-1 overflow-auto">
            {mockup ?? (
              <div className="flex h-full items-center justify-center font-mono text-label-12 text-muted-foreground">
                preview unavailable
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
