import { codeToHtml } from "shiki"

import { Section } from "@/app/(marketing)/_components/section"
import { SectionHeader } from "@/app/(marketing)/_components/section-header"

import { CliStartTabs } from "./cli-start-tabs"
import {
  CLI_START_SNIPPETS,
  type CliStartSlug,
} from "./cli-start-snippets"

/**
 * The "Get started" section. Same visual rhythm as the homepage
 * Ecosystem section: a `<SectionHeader>` on top, then a tabbed
 * 2-col grid (cards on the left, code mockup on the right) for
 * the four install steps.
 *
 * Shiki pre-highlights each snippet server-side. The
 * pre-rendered HTML is threaded into the Client
 * `<CliStartTabs>` as plain strings, because Next 16 forbids
 * rendering an async Server Component as a child of a Client
 * Component (Radix Tabs is `"use client"`).
 *
 * `defaultColor: false` is mandatory: without it Shiki emits
 * inline `color` styles that win over the CSS variables in
 * `globals.css` and dark-mode flipping breaks.
 */
export async function CliStart({ id }: { id?: string } = {}) {
  const htmlBySlug: Record<CliStartSlug, { tabName: string; html: string }[]> =
    {
      install: [],
      list: [],
      info: [],
      init: [],
    }

  await Promise.all(
    (Object.keys(CLI_START_SNIPPETS) as CliStartSlug[]).flatMap((slug) =>
      CLI_START_SNIPPETS[slug].files.map((file) =>
        codeToHtml(file.code, {
          lang: file.lang,
          themes: { light: "github-light", dark: "github-dark" },
          defaultColor: false,
        }).then((html) => {
          htmlBySlug[slug].push({ tabName: file.tabName, html })
        }),
      ),
    ),
  )

  return (
    <Section {...(id ? { id } : {})}>
      <SectionHeader
        eyebrow="Get started"
        title="Bring your first template into your workspace."
        subtitle="Four steps. Each command runs independently."
        bordered={true}
      />
      <CliStartTabs htmlBySlug={htmlBySlug} />
    </Section>
  )
}
