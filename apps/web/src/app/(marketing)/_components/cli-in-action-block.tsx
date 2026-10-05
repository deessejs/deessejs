import Link from "next/link"
import { ArrowUpRight } from "lucide-react"

import { Section } from "@/app/(marketing)/_components/section"
import { CliWorkbench } from "@/app/(marketing)/_components/cli-workbench"
import { CliInActionStatic } from "@/app/(marketing)/_components/cli-in-action-static"
import type { EditorTabId } from "@/lib/marketing/cli-workbench-data"

import { CLI_COMMAND, CLI_INSTALL_GUIDE_HREF } from "./cli-in-action-block-constants"

/**
 * Shared "From registry to working project." block, rendered on both
 * the marketing homepage (`Home.CliInAction`) and the `/cli` product
 * page. Owns the copy and the layout; receives the pre-rendered Shiki
 * HTML per editor tab as a prop so the caller controls when the
 * highlighting cost is paid (and can cache it later if needed).
 *
 * Server Component. The block renders a `<Section>` wrapper itself,
 * including its top border, so callers only write a single tag.
 *
 * Layout split:
 *   • `lg+`  : editorial column (4/12) + animated IDE workbench (8/12).
 *              The workbench plays a Motion choreography on viewport
 *              entry, respects `prefers-reduced-motion`.
 *   • `<lg`  : editorial + static 3-cell transformation panel
 *              (`<CliInActionStatic>`).
 */
export function CliInActionBlock({
  editorHtml,
}: {
  /** Pre-highlighted Shiki HTML per editor tab id. */
  editorHtml: Record<EditorTabId, string>
}) {
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
              $ {CLI_COMMAND}
            </code>
            {}from your terminal.
          </p>
          <Link
            href={CLI_INSTALL_GUIDE_HREF}
            className="inline-flex w-fit items-center gap-1 self-start text-label-13 text-foreground hover:underline underline-offset-4"
          >
            Read the install guide
            <ArrowUpRight aria-hidden className="size-3" />
          </Link>
        </div>

        {/* Mobile + tablet: static panel — full width below */}
        <div className="block p-4 lg:hidden">
          <CliInActionStatic
            command={CLI_COMMAND}
            installGuideHref={CLI_INSTALL_GUIDE_HREF}
          />
        </div>
      </div>
    </Section>
  )
}
