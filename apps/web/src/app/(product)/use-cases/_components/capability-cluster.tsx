"use client"

import * as React from "react"
import {
  Bell,
  CreditCard,
  Database,
  Layers,
  LineChart,
  Lock,
  type LucideIcon,
  Workflow,
} from "lucide-react"

import { cn } from "@workspace/ui/lib/utils"

/**
 * Cluster-driven capabilities section for use-case pages.
 *
 * The capabilities ship in 4 thematic clusters (Auth & identity,
 * Billing & growth, Operator console, Background work), not as
 * 8 flat cards. Each cluster owns 3 capability rows with a short
 * paragraph that says what the buyer actually gets — not just a
 * feature label.
 *
 * Layout: alternating 2-col sections, one per cluster.
 *   - Cluster 1 (index 0): cluster copy LEFT  + mockup RIGHT
 *   - Cluster 2 (index 1): mockup LEFT  + cluster copy RIGHT
 *   - Cluster 3 (index 2): cluster copy LEFT  + mockup RIGHT
 *   - Cluster 4 (index 3): mockup LEFT  + cluster copy RIGHT
 *
 * The alternation gives the page rhythm without forcing every
 * section into the same exact shape. Below the cluster list, a
 * single CTA pushes the visitor to action instead of leaving
 * them staring at the page.
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
  className,
}: {
  clusters: ReadonlyArray<CapabilityCluster>
  /**
   * Map keyed by cluster.id → ReactNode (the cluster's mockup).
   * Clusters without a mockup fall back to a quiet "preview" panel
   * so the column never reads as blank.
   */
  mockups: Record<string, React.ReactNode | undefined>
  className?: string
}) {
  return (
    <div className={cn("flex flex-col divide-y divide-border", className)}>
      {clusters.map((cluster, idx) => {
        const Icon = ICON_REGISTRY[cluster.iconName]
        // Even indices (0, 2) get copy on the left; odd (1, 3) flip.
        const reverse = idx % 2 === 1
        return (
          <section
            key={cluster.id}
            className="grid grid-cols-1 lg:grid-cols-2 lg:divide-x lg:divide-border"
          >
            <div
              className={cn(
                "flex flex-col gap-6 p-6 lg:p-10",
                reverse ? "lg:order-2 lg:border-l" : "lg:order-1",
              )}
            >
              <div className="flex items-center gap-2">
                {Icon ? (
                  <Icon
                    className="text-foreground size-4 shrink-0"
                    aria-hidden
                  />
                ) : null}
                <h3 className="text-heading-24 tracking-tight text-foreground">
                  {cluster.title}
                </h3>
              </div>
              <p className="max-w-xl text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                {cluster.lead}
              </p>
              <div className="flex flex-col divide-y divide-border border-y border-border">
                {cluster.rows.map((row) => (
                  <div
                    key={row.id}
                    className="flex flex-col gap-2 py-5"
                  >
                    <h4 className="text-heading-20 tracking-tight text-foreground">
                      {row.title}
                    </h4>
                    <p className="max-w-xl text-copy-16 text-foreground leading-7">
                      {row.body}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div
              className={cn(
                "relative flex items-stretch overflow-hidden",
                reverse ? "lg:order-1" : "lg:order-2",
              )}
            >
              <MockupFrame
                clusterId={cluster.id}
                className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%]"
              >
                {mockups[cluster.id] ?? (
                  <div className="flex h-full items-center justify-center font-mono text-label-12 text-muted-foreground">
                    preview unavailable
                  </div>
                )}
              </MockupFrame>
            </div>
          </section>
        )
      })}
    </div>
  )
}

/**
 * macOS-style mockup frame. Wraps each cluster's mockup in
 * chrome (traffic-light dots + monospace title) so every cluster
 * shares the same visual signature.
 */
function MockupFrame({
  clusterId,
  children,
  className,
}: {
  clusterId: string
  children: React.ReactNode
  className?: string
}) {
  return (
    <div
      className={cn(
        "flex w-full flex-col overflow-hidden rounded-md border border-border bg-background",
        className,
      )}
    >
      <div className="flex items-center justify-start gap-2 border-b border-border bg-muted/40 px-4 py-3">
        <span aria-hidden className="block size-3 rounded-full bg-[#ff5f57]" />
        <span aria-hidden className="block size-3 rounded-full bg-[#febc2e]" />
        <span aria-hidden className="block size-3 rounded-full bg-[#28c840]" />
        <span className="ml-3 truncate font-mono text-label-12 text-muted-foreground">
          {clusterId}
        </span>
      </div>
      <div className="flex-1 overflow-auto">{children}</div>
    </div>
  )
}
