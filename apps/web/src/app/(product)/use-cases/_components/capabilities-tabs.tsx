"use client"

import * as React from "react"
import {
  ArrowRight,
  type LucideIcon,
} from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"

import { cn } from "@workspace/ui/lib/utils"

import type { Capability } from "../_data"

/**
 * Capabilities-driven tabs for use-case pages.
 *
 * Mirrors the mental model of `<SurfacesTabs>` on the homepage:
 * the left column lists every capability (8 for SaaS) as a card,
 * every card visible at once, separated by `divide-y`. Selecting
 * a card swaps the right column's mockup to match.
 *
 * Difference from SurfacesTabs:
 *   - Cards carry the full capability title + description, not
 *     just a teaser (we want the buyer to read the list as a
 *     checklist of what they'll get).
 *   - The right column is a proper mockup frame (macOS chrome +
 *     border), not a placeholder. The whole illustration is
 *     visible — no peek pattern, since with a real mockup
 *     there is nothing to hide.
 *   - The mobile layout is one column: cards first, mockup
 *     pinned at the bottom that updates as the user scrolls
 *     past a card.
 *
 * Mockup lookup is keyed on capability.mockupSlug. Each entry
 * in `mockups` should be a ReactNode renderable inside a
 * `<TabsContent>`. Capabilities whose mockupSlug has no entry
 * fall back to a text-only "spec snippet" placeholder so the
 * left list never lies about what the user will get.
 */

type Icon = LucideIcon | null

export type CapabilityMockups = Record<
  string,
  React.ReactNode | undefined
>

export function CapabilitiesTabs({
  capabilities,
  mockups,
  iconMap,
  className,
}: {
  /** Ordered list of capabilities to render. */
  capabilities: ReadonlyArray<Capability>
  /** Map keyed by capability.mockupSlug → rendered mockup. */
  mockups: CapabilityMockups
  /** Optional icon map keyed by capability.id → Lucide icon component. */
  iconMap?: Record<string, Icon>
  className?: string
}) {
  const first = capabilities[0]
  if (!first) return null
  const firstSlug = first.mockupSlug ?? first.id

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className={cn(
        "flex flex-col lg:flex-row divide-y divide-border lg:divide-y-0 lg:divide-x divide-border",
        className,
      )}
    >
      <TabsList
        aria-label="Capabilities"
        className="flex flex-col divide-y divide-border border-0 bg-transparent p-0 h-auto w-full lg:w-auto lg:min-w-[320px] lg:max-w-md"
      >
        {capabilities.map((cap) => {
          const Icon = iconMap?.[cap.id] ?? null
          const value = cap.mockupSlug ?? cap.id
          return (
            <TabsTrigger
              key={cap.id}
              value={value}
              className="group flex flex-col items-start gap-2 rounded-none bg-transparent p-6 text-left h-auto w-full shadow-none border-0
                text-foreground/70 hover:text-foreground hover:bg-accent/40
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
                <h3 className="text-heading-20 tracking-tight !m-0">
                  {cap.title}
                </h3>
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {cap.description}
              </p>
              <span className="inline-flex items-center gap-1 text-label-13 text-foreground pt-1">
                Preview
                <ArrowRight
                  className="size-3 transition-transform group-data-[state=active]:translate-x-0.5"
                  aria-hidden
                />
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      <div className="flex-1 min-h-[320px] lg:min-h-[480px]">
        {capabilities.map((cap) => {
          const value = cap.mockupSlug ?? cap.id
          const mockup = cap.mockupSlug
            ? mockups[cap.mockupSlug]
            : undefined
          return (
            <TabsContent
              key={cap.id}
              value={value}
              className="relative flex-1 outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
            >
              <MockupFrame
                title={cap.title}
                body={cap.description}
                hasMockup={Boolean(mockup)}
              >
                {mockup}
              </MockupFrame>
            </TabsContent>
          )
        })}
      </div>
    </Tabs>
  )
}

/**
 * Renders a mockup inside a macOS-style chrome (3 dots + label) so
 * every capability looks like a real artefact, not a fragmented
 * component. Used as the right-column content for each
 * `<TabsContent>` in `<CapabilitiesTabs>`.
 */
function MockupFrame({
  title,
  body,
  hasMockup,
  children,
}: {
  title: string
  body: string
  hasMockup: boolean
  children?: React.ReactNode
}) {
  return (
    <div className="absolute inset-0 flex items-stretch p-6 lg:p-8">
      <div className="flex w-full flex-col overflow-hidden rounded-md border border-border bg-background">
        <div className="flex items-center justify-start gap-2 border-b border-border bg-muted/40 px-4 py-3">
          <span aria-hidden className="block size-3 rounded-full bg-[#ff5f57]" />
          <span aria-hidden className="block size-3 rounded-full bg-[#febc2e]" />
          <span aria-hidden className="block size-3 rounded-full bg-[#28c840]" />
          <span className="ml-3 truncate font-mono text-label-12 text-muted-foreground">
            {title.toLowerCase().replace(/\s+/g, "-")}
          </span>
        </div>
        <div className="flex-1 overflow-auto">
          {hasMockup ? (
            children
          ) : (
            <div className="flex h-full flex-col gap-2 p-6">
              <span className="font-mono text-label-12 text-muted-foreground">
                spec
              </span>
              <p className="text-copy-16 text-foreground leading-7">
                {body}
              </p>
              <span className="mt-auto font-mono text-label-12 text-muted-foreground">
                {/* placeholder slug — survives when no mockup is wired */}
                wire at first integration
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
