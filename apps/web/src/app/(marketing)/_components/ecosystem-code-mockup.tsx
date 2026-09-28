import { codeToHtml } from "shiki"

import {
  ECOSYSTEM_SNIPPETS,
  type EcosystemSlug,
} from "./ecosystem-snippets"

/**
 * Per-tab code mockup for the homepage Ecosystem section.
 *
 * Server Component — runs `shiki` server-side, so the highlighted
 * HTML is produced once per page request and streamed into the React
 * tree without ever shipping `shiki` into the client JS bundle. The
 * dual-theme render (`themes: { light, dark }, defaultColor: false`)
 * relies on the CSS swap in
 * `packages/ui/src/styles/globals.css` (rules around line 169:
 * `html .shiki` -> `var(--shiki-light)`, `html.dark .shiki` -> `var(--shiki-dark)`).
 * The `defaultColor: false` flag is mandatory — without it, Shiki
 * emits inline `color` styles that win over the CSS variables and
 * dark mode would not flip.
 *
 * Chrome mimics a macOS editor window: three coloured dots (red /
 * yellow / green) at the left of the title bar, the filename in
 * monospace next to them, then the highlighted code. `rounded-none`
 * matches every other card surface on the homepage (see
 * `apps/web/src/app/(marketing)/_components/section.tsx` and the
 * shared-border rhythm pattern); prose surfaces like the KB
 * `MdxPre` use `rounded-md` because they live inside a typography
 * container.
 *
 * Intended to be rendered inside `<TabsContent>` of
 * `ecosystem-tabs.tsx` — Radix's tab switching then only toggles
 * `data-state`, no re-rendering of this component.
 */
export async function EcosystemCodeMockup({ slug }: { slug: EcosystemSlug }) {
  const { code, lang, tabName } = ECOSYSTEM_SNIPPETS[slug]

  const html = await codeToHtml(code, {
    lang,
    themes: { light: "github-light", dark: "github-dark" },
    defaultColor: false,
  })

  return (
    <div className="bg-background border border-border overflow-hidden rounded-none">
      <div className="flex items-center gap-2 px-4 py-2 border-b border-border bg-background/40">
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#ff5f57]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#febc2e]"
        />
        <span
          aria-hidden
          className="block size-3 rounded-full bg-[#28c840]"
        />
        <span className="ml-3 font-mono text-[11px] text-muted-foreground truncate">
          {tabName}
        </span>
      </div>
      <div
        className="overflow-x-auto p-4 text-sm leading-6"
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
