import type { Metadata } from "next"
import { codeToHtml } from "shiki"

import { CliInActionBlock } from "@/app/(marketing)/_components/cli-in-action-block"
import { CLI_INSTALL_GUIDE_HREF } from "@/app/(marketing)/_components/cli-in-action-block-constants"
import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"
import { FinalCta } from "@/components/pages/_shared/final-cta"
import {
  EDITOR_TABS,
  EDITOR_TAB_CONTENT,
  EDITOR_TAB_LANG,
} from "@/lib/marketing/cli-workbench-data"

import { CLI_COMMANDS } from "./_components/cli-commands"
import { ProductHero } from "./_components/product-hero"

/**
 * Four canonical install steps, lifted from
 * `apps/web/content/knowledge-base/guides/install-deessejs-cli.mdx`
 * sections 1-3 plus the scaffold example. Order matches the order
 * the steps appear in the KB guide. The KB guide is the source of
 * truth; update this list in lockstep if the KB guide changes.
 */
const INSTALL_STEPS = [
  {
    heading: "Install",
    body: "npm install -g deessejs. Verify with deessejs --version.",
  },
  {
    heading: "Authenticate",
    body: "Run deessejs auth login. The browser opens for the device flow; the token is stored locally and reused.",
  },
  {
    heading: "Discover",
    body: "Run deessejs list. Pick the template closest to your target stack.",
  },
  {
    heading: "Scaffold",
    body: "Run deessejs init <slug>. The CLI clones the repo, detects your package manager, and installs dependencies.",
  },
] as const

export const metadata: Metadata = {
  title: "CLI",
  description:
    "The deessejs CLI: scaffold projects from the template catalog. Install with npm install -g deessejs, then run deessejs init <slug>.",
}

/**
 * Marketing route at `/cli`. Deep-dive on the `@dejs/cli` package
 * the nav already links to from the Products dropdown.
 *
 * Composition (top to bottom):
 *   1. Hero                : `UseCaseHero` reused as-is (eyebrow
 *                            hard-codes `Use case · `).
 *   2. CliWorkbench       : Server-pre-rendered Shiki HTML,
 *                            threaded into the `"use client"`
 *                            `<CliWorkbench>` as plain strings
 *                            (Next 16 forbids rendering an async
 *                            Server Component as a child of a
 *                            Client Component). Same lg+/<lg
 *                            split as the homepage section.
 *   3. Commands grid      : 3 cards (init / list / info), data
 *                            from `./_components/cli-commands.ts`.
 *   4. Install steps      : 4 cells in a 6-col grid (header
 *                            left, steps right). Mirrors the
 *                            use-case Process pattern but with
 *                            `md:grid-cols-4` to fit 4 cells.
 *   5. Final CTA          : `FinalCtaShell` from
 *                            `@/components/pages/_shared/final-cta`
 *                            (NOT the use-case-namespaced one,
 *                            it hard-codes use-case copy).
 *
 * Shiki runs at request time on the Server Component. Each tab
 * snippet is the same one the homepage CliInAction highlights.
 * `EDITOR_TAB_CONTENT` + `EDITOR_TAB_LANG` from
 * `@/lib/marketing/cli-workbench-data` are the single source of
 * truth shared across both surfaces. `defaultColor: false` is
 * mandatory (without it Shiki emits inline `color` styles that
 * win over the CSS variables in `globals.css` and dark-mode
 * flipping breaks; see `cli-in-action.tsx` lines 44-47).
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

  return (
    <>
      {/* 1. Hero */}
      <ProductHero
        eyebrow="Product · CLI"
        title="Run one command. Get a working project."
        body="The deessejs CLI is the entry point to the rest of the registry: it talks to the template catalog, scaffolds new projects, and authenticates against the cloud runtime."
        primaryCta={{
          label: "Browse templates",
          href: "/templates",
        }}
        secondaryCta={{
          label: "Read the install guide",
          href: CLI_INSTALL_GUIDE_HREF,
        }}
      />

      {/* 2. Shared CliInActionBlock. Same surface as the homepage
             CliInAction — visitor sees the same IDE-style animation
             on `/cli` as they do on `/`. */}
      <CliInActionBlock editorHtml={editorHtml} />

      {/* 3. Commands grid. 3 cards (init / list / info). Data sourced
             from `./_components/cli-commands.ts`, the marketing
             mirror of `apps/cli/src/commands/*.ts`. */}
      <Section>
        <SectionHeader
          eyebrow="Commands"
          title="Three commands, one registry."
          subtitle="Everything you do with the registry starts here. No flags to memorize for the common case. `init <slug>` is enough to scaffold a working project."
        />
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-3 lg:divide-x lg:divide-y-0">
          {CLI_COMMANDS.map((cmd) => (
            <div
              key={cmd.name}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <h3 className="font-mono text-copy-16 font-medium text-foreground">
                {cmd.name}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {cmd.description}
              </p>
              <code className="mt-1 rounded bg-muted px-2 py-1 font-mono text-copy-12 text-foreground/90">
                $ {cmd.example}
              </code>
              <ul className="mt-1 flex flex-col gap-1">
                {cmd.flags.map((flag) => (
                  <li
                    key={flag}
                    className="font-mono text-label-13 text-muted-foreground"
                  >
                    {flag}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. Install steps. 6-col grid: header left (col-span-2),
             ordered list right (col-span-4, md:grid-cols-4 to fit
             4 cells). Mirrors the use-case Process pattern but
             drops the `Step 0X` mono label into the same row as
             the heading. */}
      <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
        <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-2 lg:p-10">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Install
          </p>
          <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
            From npm install to a running project.
          </h2>
          <p className="max-w-md text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
            Four steps and the CLI is yours. The same flow works on every template the registry ships.
          </p>
        </div>
        <ol className="grid grid-cols-1 divide-y divide-border lg:col-span-4 !p-0 border-0 md:grid-cols-4 md:divide-x md:divide-y-0">
          {INSTALL_STEPS.map((step, idx) => (
            <li
              key={step.heading}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </div>

      {/* 5. Final CTA. Two doors: browse the templates, or read
             the install guide for the step-by-step. Calls the
             `_shared/final-cta` shell directly because the
             use-case-namespaced `FinalCta` hard-codes use-case
             copy that does not fit this page. */}
      <FinalCta
        noBorderB
        eyebrow="Try it"
        title="Two doors, same CLI."
        body="Pick a template and scaffold it yourself, or read the install guide for the step-by-step."
        actions={[
          {
            label: "Browse templates",
            href: "/templates",
            variant: "default",
            withArrow: true,
          },
          {
            label: "Read the install guide",
            href: CLI_INSTALL_GUIDE_HREF,
            variant: "outline",
          },
        ]}
      />
    </>
  )
}