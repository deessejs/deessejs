import Markdown from "react-markdown"

import { Prose } from "@/components/blog/prose"
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
 *   - Reuses the marketing-site `Prose` typography styles so headings, code
 *     blocks, tables, and lists match the rest of the templates surface.
 *
 * Server-rendered: `react-markdown` executes in the RSC payload, no client JS
 * is shipped for the Markdown pipeline.
 *
 * @see `apps/web/src/lib/templates/safe-readme.ts` — sanitizer config.
 */
export const TemplateReadme = ({ readme }: TemplateReadmeProps) => {
  if (!readme) return null
  return (
    <section
      aria-label="README"
      data-testid="template-readme"
      className="flex flex-col gap-3"
    >
      <h2 className="text-label-14 text-muted-foreground">Overview</h2>
      <Prose id="template-readme">
        <Markdown {...safeReadmeOptions}>{readme}</Markdown>
      </Prose>
    </section>
  )
}
