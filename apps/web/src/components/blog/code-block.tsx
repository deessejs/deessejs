import { codeToHtml } from "shiki"

interface CodeBlockProps {
  code: string
  language?: string
  title?: string
  size?: "sm" | "lg"
  /**
   * @deprecated Kept for parity with the source design. The current
   * design does not render tabs; this prop is a no-op and will be
   * removed once the upstream API is finalised.
   */
  tabs?: boolean
}

const sizeClasses = {
  sm: "p-3 text-xs",
  lg: "p-6 text-sm",
} as const

/**
 * Server-rendered code block. Uses `shiki` at request time to
 * produce the highlighted HTML (no client JS shipped). The chrome
 * mimics a macOS terminal window: three coloured dots + optional
 * filename in the header, monospace body below.
 *
 * Used by the `pre` entry of `apps/web/src/components/blog/mdx-components.tsx`
 * so every Markdown/MDX fenced block (` ```ts `, etc.) renders
 * through this component instead of rehype-pretty-code's default
 * `<pre><code>`.
 */
export async function CodeBlock({
  code,
  language = "typescript",
  size = "sm",
}: CodeBlockProps) {
  const html = await codeToHtml(code, {
    lang: language,
    theme: "github-dark",
  })

  return (
    <div className="bg-background w-full overflow-hidden rounded-none border border-border">

      <div
        className={`overflow-x-auto ${sizeClasses[size]}`}
        dangerouslySetInnerHTML={{ __html: html }}
      />
    </div>
  )
}
