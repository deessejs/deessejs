import Link from "next/link"
import { ArrowUpRight } from "lucide-react"
import { codeToHtml } from "shiki"

import { Section } from "@/app/(marketing)/_components/section"
import { CliWorkbench } from "@/app/(marketing)/_components/cli-workbench"
import { CliInActionStatic } from "@/app/(marketing)/_components/cli-in-action-static"
import {
  EDITOR_TAB_CONTENT,
  EDITOR_TAB_LANG,
  EDITOR_TABS,
  type EditorTabId,
} from "@/lib/marketing/cli-workbench-data"

const COMMAND = "deessejs init saas-starter"
const INSTALL_GUIDE_HREF = "/knowledge-base/guides/install-deessejs-cli"

/**
 * CLI section on the marketing homepage.
 *
 * Server Component. The two editor snippets (package.json and
 * AGENTS.md) are pre-highlighted by Shiki at request time and
 * threaded into the Client `<CliWorkbench>` as plain HTML strings,
 * because Next 16 forbids rendering an async Server Component as
 * a child of a Client Component (the workbench is `"use client"`
 * for the Motion choreography + tab state).
 *
 * Layout split:
 *   • `lg+`  : editorial column (4/12) + animated IDE workbench (8/12).
 *              The workbench shows the full transformation in a
 *              single frame — Explorer / Editor / Terminal —
 *              choreographed by Motion on viewport entry, plays once,
 *              respects `prefers-reduced-motion`.
 *   • `<lg`  : editorial + static 3-cell transformation panel
 *              (`<CliInActionStatic>`). The IDE-style panel is too
 *              dense to read on small screens; the static panel
 *              carries the same information in a simpler shape.
 *
 * Both branches share the canonical command (`deessejs init
 * saas-starter`, matching `apps/cli/src/commands/init.ts`) and the
 * install guide CTA.
 */
export async function CliInAction() {
  // Pre-render every editor snippet to dual-theme Shiki HTML once
  // at request time. `defaultColor: false` is mandatory: without it
  // Shiki emits inline `color` styles that win over the CSS
  // variables in `globals.css`, and dark mode would not flip.
  const highlightedHtml = await Promise.all(
    EDITOR_TABS.map(async (tab) => {
      const html = await codeToHtml(EDITOR_TAB_CONTENT[tab.id], {
        lang: EDITOR_TAB_LANG[tab.id],
        themes: { light: "github-light", dark: "github-dark" },
        defaultColor: false,
      })
      return [tab.id, html] as const
    }),
  )
  const editorHtml: Record<EditorTabId, string> = {
    "package.json": highlightedHtml[0]![1],
    "AGENTS.md": highlightedHtml[1]![1],
  }

  return (
    <Section className="border-t border-border">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:divide-x lg:divide-y-0">
        {/* Left column: animated workbench (the code editor) */}
        <div className="hidden p-4 lg:block">
          <CliWorkbench editorHtml={editorHtml} />
        </div>

        {/* Right column: editorial header + lead + command */}
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            The DeesseJS CLI
          </p>
          <h2 className="text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            From registry to working project.
          </h2>
          <p className="text-copy-14 leading-6 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Run one command and the CLI scaffolds the same stack the docs use: contracts wired, providers connected, the template ready to start. Edit the template name to swap surfaces, databases, or auth providers before the first file lands.
          </p>
          <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
            Choose a template, initialize it with the CLI, then inspect
            the result.
          </p>
          <p className="text-copy-14 text-muted-foreground mt-2">
            Run{}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-copy-13 text-foreground/90">
              $ deessejs init saas-starter
            </code>
            {}from your terminal.
          </p>
          <Link
            href={INSTALL_GUIDE_HREF}
            className="inline-flex w-fit items-center gap-1 self-start text-label-13 text-foreground hover:underline underline-offset-4"
          >
            Read the install guide
            <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        </div>

        {/* Mobile + tablet: static panel — full width below */}
        <div className="block p-4 lg:hidden">
          <CliInActionStatic
            command={COMMAND}
            installGuideHref={INSTALL_GUIDE_HREF}
          />
        </div>
      </div>
    </Section>
  )
}
