import { CopyButton } from "@/components/catalog/shared/copy-button"

type Props = {
  snippet: string
}

/**
 * Server component that renders a code snippet in a styled
 * `<pre>` with a copy-to-clipboard button overlay. Mirror of
 * `apps/web/src/app/(marketing)/components/_components/component-code.tsx`.
 *
 * V1 ships inline styling and `font-mono` — no Shiki (heavy +
 * only wired through the MDX pipeline). V2 swaps for proper
 * syntax highlighting.
 */
export function CodeBlock({ snippet }: Props) {
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