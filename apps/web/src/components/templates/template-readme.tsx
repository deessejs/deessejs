import { MarkdownAsync } from "react-markdown"

import { mdxComponents } from "@/components/blog/mdx-components"
import { safeReadmeOptions } from "@/lib/templates/safe-readme"

export type TemplateReadmeProps = {
  readme: string | undefined
}

/**
 * Render a template's README fetched from GitHub.
 *
 * Sanitization and protocol allow-listing live in `@/lib/templates/safe-readme`
 * (see the threat-model comment there). This component is a thin presenter:
 *
 *   - Returns `null` when the README is missing (404 on `/readme`, payload too
 *     large, GitHub rate-limited) so the section disappears cleanly rather than
 *     rendering an empty card. The "View source" CTA in the hero remains the
 *     canonical way to read the upstream file in that case.
 *   - Reuses the `mdxComponents` map from `apps/web/src/components/blog/mdx-components`
 *     so headings, code blocks, tables, and lists render through the shared
 *     @workspace/ui/typography primitives — same surface as the blog/changelog/KB
 *     MDX content.
 *
 * **Async.** Uses `MarkdownAsync` (not the sync `Markdown`) because the
 * rehype pipeline contains `rehype-pretty-code`, which returns an async
 * transformer (it has to load shiki grammars on first use, which is
 * inherently async). The sync `Markdown` component calls
 * `processor.runSync(...)` internally and throws
 * `runSync finished async. Use run instead` (digest 2953611744 on
 * production) when it hits that plugin. Server Components may be
 * async in Next App Router, so the cost is one extra microtask at
 * render time.
 *
 * Server-rendered: rendering happens in the RSC payload, no client JS
 * is shipped for the Markdown pipeline (or for shiki).
 *
 * @see `apps/web/src/lib/templates/safe-readme.tsx` — sanitizer config.
 */
export const TemplateReadme = async ({ readme }: TemplateReadmeProps) => {
  if (!readme) return null
  const rendered = await MarkdownAsync({
    ...safeReadmeOptions,
    children: readme,
    components: mdxComponents,
  })
  return (
    <section
      aria-label="README"
      data-testid="template-readme"
      className="flex flex-col gap-3"
    >
      <h2 className="text-label-14 text-muted-foreground">Overview</h2>
      <article
        id="template-readme"
        className="text-base leading-7 text-pretty [&_pre]:rounded-lg [&_pre]:border [&_pre]:border-border/40 [&_pre]:bg-muted/30 [&_pre]:overflow-x-auto [&_pre]:my-6 [&_pre]:p-4 [&_pre]:text-copy-14 [&_pre]:font-mono [&_pre_code]:block [&_pre_code]:bg-transparent [&_pre_code]:px-0 [&_pre_code]:py-0 [&_[data-highlighted-line]]:bg-foreground/5 [&_[data-highlighted-line]]:relative [&_[data-highlighted-chars]]:bg-foreground/10 [&_[data-highlighted-chars]]:rounded"
      >
        {rendered}
      </article>
    </section>
  )
}
