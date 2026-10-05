import { codeToHtml } from "shiki"

import { CliInActionBlock } from "@/app/(marketing)/_components/cli-in-action-block"
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
 * into the shared `<CliInActionBlock>` as plain strings, because
 * Next 16 forbids rendering an async Server Component as a child
 * of a Client Component (the workbench is `"use client"` for the
 * Motion choreography + tab state).
 *
 * `defaultColor: false` is mandatory: without it Shiki emits
 * inline `color` styles that win over the CSS variables in
 * `globals.css`, and dark mode would not flip.
 *
 * The block itself, the copy, and the layout live in
 * `<CliInActionBlock>` so the `/cli` product page can render the
 * same surface without copy drift.
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

  return <CliInActionBlock editorHtml={editorHtml} />
}
