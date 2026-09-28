import { CopyButton } from "@/components/catalog/shared/copy-button"

type Props = {
  snippet: string
}

/**
 * Catalog chrome: code block.
 *
 * Server component that renders a code snippet in a styled `<pre>`
 * with a copy-to-clipboard button overlay.
 *
 * V1 ships with inline styling and `font-mono` — no Shiki (heavy +
 * only wired through the MDX pipeline). V2 swaps for proper syntax
 * highlighting.
 *
 * Pre-refactor: this file lived as
 * `apps/web/src/app/(product)/components/_components/component-code.tsx`
 * with a near-identical copy at
 * `apps/web/src/app/(product)/blocks/_components/code-block.tsx`.
 * The two files differed only in their JSDoc comment and the
 * exported component name. Both have been deleted; the call sites
 * import `CatalogCode` from here instead.
 */
export function CatalogCode({ snippet }: Props) {
  return (
    <div className="relative">
      <CopyButton
        text={snippet}
        className="absolute right-2 top-2"
      />
      <pre className="overflow-x-auto bg-muted/40 p-4 pr-12 text-copy-13 font-mono leading-6 text-foreground">
        <code>{snippet}</code>
      </pre>
    </div>
  )
}
