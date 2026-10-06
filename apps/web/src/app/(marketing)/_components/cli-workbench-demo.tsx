import { CliWorkbench } from "@/app/(marketing)/_components/cli-workbench"
import { CliInActionStatic } from "@/app/(marketing)/_components/cli-in-action-static"
import { Section } from "@/app/(marketing)/_components/section"
import type { EditorTabId } from "@/lib/marketing/cli-workbench-data"

/**
 * Shared wrapper around `<CliWorkbench>` for the marketing surface
 * that renders the IDE-style demo as a self-contained section.
 *
 * Renders:
 *   • `<Section>` (border-b) on `lg+` and above
 *   • the workbench on `lg+`
 *   • the static mobile fallback (`<CliInActionStatic>`) under `lg`
 *
 * Owns no copy. Each caller supplies the eyebrow / heading / body
 * for its own page via a sibling `<CliInActionEditorial>` (or any
 * layout of its choice) so the homepage and `/cli` can tell
 * different stories with the same workbench underneath.
 *
 * `terminalLines` is optional. When omitted, the workbench falls
 * back to a default that mirrors the real `deessejs init
 * saas-starter` flow (cloned → package manager detected →
 * dependencies installed).
 */
export function CliWorkbenchDemo({
  editorHtml,
  terminalLines,
}: {
  /** Pre-highlighted Shiki HTML per editor tab id. */
  editorHtml: Record<EditorTabId, string>
  /** Optional Terminal pane override. */
  terminalLines?: readonly [string, ReadonlyArray<string>, string]
}) {
  return (
    <Section className="border-t border-border">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:divide-x lg:divide-y-0">
        <div className="hidden p-4 lg:block">
          <CliWorkbench
            editorHtml={editorHtml}
            {...(terminalLines ? { terminalLines } : {})}
          />
        </div>
        <div className="block p-4 lg:hidden">
          <CliInActionStatic
            command="deessejs init saas-starter"
            installGuideHref="/knowledge-base/guides/install-deessejs-cli"
          />
        </div>
      </div>
    </Section>
  )
}
