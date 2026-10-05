"use client"

import { ArrowRight, type LucideIcon } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

import { DotGrid } from "@/app/(marketing)/_components/dot-grid"

import { CliStartMockup } from "./cli-start-mockup"
import type { CliStartSlug } from "./cli-start-snippets"

/**
 * Tabbed view of the four install steps. Mirrors the visual
 * pattern of the homepage Ecosystem section.
 *
 * Layout: 2-col grid on `lg+` (cards stacked on the left, code
 * mockup on the right; same `minmax(320px, 28rem) _ 1fr` ratio).
 * On smaller viewports the grid collapses to a single column
 * with the cards on top and the mockup below.
 *
 * Each card on the left is a `TabsTrigger` (icon + heading +
 * description + "Read the step" link). The active card picks
 * up `bg-accent/40`. The code mockup on the right uses the
 * same DotGrid background + margin-break translation as the
 * Ecosystem section.
 *
 * Pre-rendered HTML is threaded in by the parent Server
 * Component because the Radix Tabs primitive is a Client
 * Component; the snippets travel through the boundary as
 * plain strings.
 */
type CliStartTab = {
  slug: CliStartSlug
  name: string
  description: string
  icon: LucideIcon
}

const CLI_START_TABS: ReadonlyArray<CliStartTab> = [
  {
    slug: "install",
    name: "Install the CLI",
    description:
      "Node.js 20 or later. The package ships under @deessejs/cli; npm makes it available on your PATH.",
    icon: ArrowRight,
  },
  {
    slug: "list",
    name: "Find a template",
    description:
      "Browse the registry with one command. Filter by category to narrow your options.",
    icon: ArrowRight,
  },
  {
    slug: "info",
    name: "Inspect your choice",
    description:
      "Read the template's stack, scripts, and contracts before you bring it into your project.",
    icon: ArrowRight,
  },
  {
    slug: "init",
    name: "Scaffold the project",
    description:
      "Clone the template and install its dependencies. Then move into the new directory and start the dev server.",
    icon: ArrowRight,
  },
]

export function CliStartTabs({
  htmlBySlug,
}: {
  htmlBySlug: Record<
    CliStartSlug,
    { tabName: string; html: string }[]
  >
}) {
  const firstSlug = CLI_START_TABS[0]?.slug ?? "install"

  return (
    <Tabs
      defaultValue={firstSlug}
      orientation="vertical"
      className="grid grid-cols-1 lg:grid-cols-[minmax(320px,28rem)_1fr]"
    >
      <TabsList
        aria-label="Get started"
        className="flex flex-col divide-y divide-border border-b border-border lg:border-b-0 lg:border-r bg-transparent p-0 h-auto w-full rounded-none!"
      >
        {CLI_START_TABS.map((tab) => {
          const Icon = tab.icon
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
              <div className="flex w-full items-start gap-2">
                <Icon
                  className="text-foreground size-4 shrink-0"
                  aria-hidden
                />
                <h3 className="text-heading-20 tracking-tight !m-0">
                  {tab.name}
                </h3>
              </div>
              <p className="text-copy-14 text-muted-foreground leading-6 !m-0 text-balance">
                {tab.description}
              </p>
              <span className="inline-flex items-center gap-1 text-label-13 text-foreground pt-1">
                Read the step
                <ArrowRight className="size-3" aria-hidden />
              </span>
            </TabsTrigger>
          )
        })}
      </TabsList>

      {CLI_START_TABS.map((tab) => (
        <TabsContent
          key={tab.slug}
          value={tab.slug}
          className="relative outline-none min-h-[320px] lg:min-h-[480px] mt-0 overflow-hidden"
        >
          <DotGrid className="absolute inset-0" />

          <div className="absolute right-0 bottom-0 h-[110%] w-[110%] translate-x-[25%] translate-y-[25%] overflow-hidden">
            <CliStartMockup
              slug={tab.slug}
              files={htmlBySlug[tab.slug]}
            />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
