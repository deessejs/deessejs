import type { Metadata } from "next"
import { codeToHtml } from "shiki"

import { CliInActionEditorial } from "@/app/(marketing)/_components/cli-in-action-editorial"
import { CliInActionStatic } from "@/app/(marketing)/_components/cli-in-action-static"
import { CliWorkbench } from "@/app/(marketing)/_components/cli-workbench"
import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { FinalCta } from "@/components/pages/_shared/final-cta"
import {
  EDITOR_TABS,
  EDITOR_TAB_CONTENT,
  EDITOR_TAB_LANG,
} from "@/lib/marketing/cli-workbench-data"

import { CliCommandsGrid } from "./_components/cli-commands-grid"
import { CliFaqSection } from "./_components/cli-faq-section"
import { CliStart } from "./_components/cli-start"
import { CLI_INSTALL_GUIDE_HREF } from "./_components/cli-page-constants"
import { ProductHero } from "./_components/product-hero"

export const metadata: Metadata = {
  title: "CLI",
  description:
    "The deessejs CLI: scaffold projects from the template registry. Install with npm i -g @deessejs/cli, then run deessejs init <slug>.",
}

/**
 * Marketing route at `/cli`. Deep-dive on the `@deessejs/cli`
 * package the nav already links to from the Products dropdown.
 *
 * Composition (top to bottom, six sections):
 *   1. Hero              : `<ProductHero>` with eyebrow
 *                          "Product · CLI", primary CTA "Get
 *                          started" (in-page anchor), secondary
 *                          CTA "Browse templates".
 *   2. Demo              : shared workbench + per-page editorial
 *                          column, fed real `init.ts` terminal
 *                          lines (cloned, dependencies installed,
 *                          ready, cd, pnpm dev) so the Terminal
 *                          is truthful, not invented.
 *   3. Parcours          : 3 numbered cells
 *                          (list, info, init) so the commands
 *                          grid reads as a user journey, not
 *                          a tech reference.
 *   4. Contrôle          : 3 useful flags
 *                          (--dir, --pm, --no-install). The
 *                          other flags live in the full
 *                          reference guide.
 *   5. Démarrage         : vertical 4-step install procedure.
 *                          No `auth login` (init does not
 *                          require authentication).
 *   6. FAQ + CTA         : 3 questions and answers, then a
 *                          two-action final CTA.
 *
 * Shiki runs at request time on the Server Component. Each tab
 * snippet is the same one the homepage CliInAction highlights.
 * `defaultColor: false` is mandatory (without it Shiki emits
 * inline `color` styles that win over the CSS variables in
 * `globals.css` and dark-mode flipping breaks).
 */
export default async function CliPage() {
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

  // Real terminal lines for the /cli demo, mirroring what
  // `apps/cli/src/commands/init.ts` prints. Includes the
  // `cd saas-starter` step the previous demo skipped, and
  // the post-install "Template ready" summary the CLI emits
  // on the success path. The /cli page opts into these
  // instead of the workbench's default lines.
  const terminalLines: readonly [string, ReadonlyArray<string>, string] = [
    "$ deessejs init saas-starter",
    [
      "✔ Cloned into ./saas-starter",
      "✔ Detected package manager: pnpm",
      "✔ Dependencies installed",
      "✓ Template ready",
    ],
    "$ cd saas-starter && pnpm dev",
  ]

  return (
    <>
      {/* 1. Hero */}
      <ProductHero
        eyebrow="Product · CLI"
        title="Start your next project from your terminal."
        body="Find a template, clone its repository, and install its dependencies with the deessejs CLI. Start from an existing codebase and make it your own."
        primaryCta={{
          label: "Get started",
          href: "#get-started",
        }}
        secondaryCta={{
          label: "Browse templates",
          href: "/templates",
        }}
      />

      {/* 2. Demo : shared workbench + per-page editorial column */}
      <Section className="border-t border-border">
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-[minmax(0,8fr)_minmax(0,4fr)] lg:divide-x lg:divide-y-0">
          <div className="hidden p-4 lg:block">
            <CliWorkbench
              editorHtml={editorHtml}
              terminalLines={terminalLines}
            />
          </div>

          <CliInActionEditorial
            eyebrow="From template to local project"
            heading="A starting point you can inspect and change."
            body="The CLI clones the selected template, detects your package manager, and installs dependencies. You get the source files on your machine; follow the template's setup steps to wire the services it expects, then start building."
            command="deessejs init saas-starter"
            cta={{
              label: "Read the setup guide",
              href: CLI_INSTALL_GUIDE_HREF,
            }}
          />

          <div className="block p-4 lg:hidden">
            <CliInActionStatic
              command="deessejs init saas-starter"
              installGuideHref={CLI_INSTALL_GUIDE_HREF}
            />
          </div>
        </div>
      </Section>

      {/* 3. Commands + flags : one unified 2-col bento grid.
             Three commands (list, info, init) on the left in the
             order a developer uses them; three useful init flags
             (--dir, --pm, --no-install) on the right as the
             customisation layer. Replaces the previous two
             sections (Parcours + Contrôle) that were rendered
             as separate blocks with duplicated headers. */}
      <Section>
        <SectionHeader
          eyebrow="Commands and flags"
          title="Find your template. Make it your project."
          subtitle="Explore the catalog, inspect your choice, and initialize it locally. Adjust the directory and installation options when you need to."
        />
        <CliCommandsGrid />
      </Section>

      {/* 4. Get started : mirror of the homepage Ecosystem section,
             4 tabs (install / list / info / init) with the
             corresponding bash code mockup on the right. */}
      <CliStart id="get-started" />

      {/* 5. FAQ */}
      <Section>
        <CliFaqSection />
      </Section>

      {/* Final CTA : swap eyebrow and title so the promise leads */}
      <FinalCta
        noBorderB
        eyebrow="Two doors"
        title="Choose your starting point."
        body="Browse the registry to pick a template, or read the setup guide for the step-by-step."
        actions={[
          {
            label: "Browse templates",
            href: "/templates",
            variant: "default",
            withArrow: true,
          },
          {
            label: "Read the setup guide",
            href: CLI_INSTALL_GUIDE_HREF,
            variant: "outline",
          },
        ]}
      />
    </>
  )
}
