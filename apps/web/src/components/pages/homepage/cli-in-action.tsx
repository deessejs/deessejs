import { codeToHtml } from "shiki"

import { CliInActionEditorial } from "@/components/marketing/cli-in-action-editorial"
import { CliInActionStatic } from "@/components/marketing/cli-in-action-static"
import { CliWorkbench } from "@/components/marketing/cli-workbench"
import { Section } from "@/components/marketing/section"
import {
  EDITOR_TAB_CONTENT,
  EDITOR_TAB_LANG,
  EDITOR_TABS,
} from "@/lib/marketing/cli-workbench-data"

/**
 * CLI section on the marketing homepage.
 *
 * Server Component (async). Pre-renders every editor snippet to
 * dual-theme Shiki HTML at request time and threads the result
 * into the shared `<CliWorkbench>` (a Client Component) as plain
 * strings, because Next 16 forbids rendering an async Server
 * Component as a child of a Client Component.
 *
 * `defaultColor: false` is mandatory: without it Shiki emits
 * inline `color` styles that win over the CSS variables in
 * `globals.css`, and dark mode would not flip.
 *
 * The workbench (`<CliWorkbench>`) and the editorial column
 * (`<CliInActionEditorial>`) are two separate shared components.
 * The homepage assembles them inside a `<Section>` so the
 * surrounding border rhythm matches every other section on the
 * page. The `/cli` product page does the same with its own copy.
 */
export async function CliInAction() {
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
  const editorHtml = Object.fromEntries(highlightedHtml) as Record<
    (typeof EDITOR_TABS)[number]["id"],
    string
  >

  return (
    <Section className="border-t border-border">
      <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:divide-x lg:divide-y-0">
        <div className="hidden p-4 lg:block">
          <CliWorkbench editorHtml={editorHtml} />
        </div>

        <CliInActionEditorial
          eyebrow="The DeesseJS CLI"
          heading="From registry to working project."
          body="Run one command and the CLI clones the template, installs its dependencies, and leaves you with a working project you can configure and start. Pick a different template slug to bring a different surface into your workspace."
          afterBody="Choose a template, initialize it with the CLI, then inspect the result."
          command="deessejs init saas-starter"
          cta={{
            label: "Read the install guide",
            href: "/knowledge-base/guides/install-deessejs-cli",
          }}
        />

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
