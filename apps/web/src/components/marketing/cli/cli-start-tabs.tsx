"use client"

import { ArrowRight } from "lucide-react"

import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs"
import { cn } from "@workspace/ui/lib/utils"

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
 * Each card on the left is a `TabsTrigger` (heading + description
 * + "View command" link). The active card picks up
 * `bg-accent/40`. The code mockup on the right is fully
 * visible (no margin-break translation; the terminal must
 * stay readable end to end).
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
}

const CLI_START_TABS: ReadonlyArray<CliStartTab> = [
  {
    slug: "install",
    name: "Install the CLI",
    description:
      "Node.js 20 or later. The package ships under @deessejs/cli; npm makes it available on your PATH.",
  },
  {
    slug: "list",
    name: "Find a template",
    description:
      "Browse the registry with one command. Filter by category to narrow your options.",
  },
  {
    slug: "info",
    name: "Inspect your choice",
    description:
      "Read the template's description, category, license, and repository before you bring it into your project.",
  },
  {
    slug: "init",
    name: "Scaffold the project",
    description:
      "Clone the template, install its dependencies. Follow the selected template's README to complete setup.",
  },
]

export function CliStartTabs({
  htmlBySlug,
}: {
  htmlBySlug: Record<CliStartSlug, { tabName: string; html: string }[]>
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
        className="flex h-auto w-full flex-col divide-y divide-border rounded-none! border-b border-border bg-transparent p-0 lg:border-r lg:border-b-0"
      >
        {CLI_START_TABS.map((tab) => {
          return (
            <TabsTrigger
              key={tab.slug}
              value={tab.slug}
              className={cn(
                "group flex h-auto w-full flex-col items-start gap-2 rounded-none border-0 bg-transparent p-6 text-left shadow-none",
                "text-foreground/60 hover:bg-accent/40 hover:text-foreground",
                "data-[state=active]:bg-accent/40 data-[state=active]:text-foreground",
                "[&:after]:hidden"
              )}
            >
              <h3 className="!m-0 text-heading-20 tracking-tight">
                {tab.name}
              </h3>
              <p className="!m-0 text-copy-14 leading-6 text-balance text-muted-foreground">
                {tab.description}
              </p>
              <span className="inline-flex items-center gap-1 pt-1 text-label-13 text-foreground">
                View command
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
          className="relative mt-0 min-h-[320px] overflow-hidden p-0 outline-none lg:min-h-[480px]"
        >
          <div className="h-full w-full p-6">
            <CliStartMockup slug={tab.slug} files={htmlBySlug[tab.slug]} />
          </div>
        </TabsContent>
      ))}
    </Tabs>
  )
}
