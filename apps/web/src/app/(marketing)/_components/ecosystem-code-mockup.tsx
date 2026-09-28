import type { EcosystemSlug } from "./ecosystem-snippets"

/**
 * Per-tab code mockup chrome for the homepage Ecosystem section.
 *
 * Pure presentational component — receives the pre-highlighted HTML
 * (Shiki, dual-theme) from the parent Server Component and wraps it
 * in the macOS-style chrome. The parent is responsible for calling
 * `codeToHtml` (server-side) because Next 16 forbids rendering an
 * async Server Component as a child of a Client Component: the
 * `<EcosystemTabs>` is `"use client"` (Radix Tabs), so the snippets
 * must be rendered up-tree and passed in as plain HTML strings.
 *
 * The dual-theme render (`themes: { light: github-light, dark:
 * github-dark }, defaultColor: false`) relies on the CSS swap in
 * `packages/ui/src/styles/globals.css` around line 169
 * (`html .shiki` -> `var(--shiki-light)`,
 * `html.dark .shiki` -> `var(--shiki-dark)`).
 * `defaultColor: false` is mandatory — without it, Shiki emits inline
 * `color` styles that win over the CSS variables and dark mode
 * would not flip.
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
 * The `slug` param anchors the visual via `data-slug` on the root
 * so DOM probes (and tests) can identify which tab the rendered
 * mockup belongs to without grepping the HTML body.
 */
export function EcosystemCodeMockup({
  slug,
  tabName,
  html,
}: {
  slug: EcosystemSlug
  tabName: string
  /** Pre-highlighted HTML from `shiki.codeToHtml({ ..., defaultColor: false })`. */
  html: string
}) {
  return (
    <div
      data-slug={slug}
      className="bg-background border border-border overflow-hidden rounded-none h-full w-full"
    >
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
