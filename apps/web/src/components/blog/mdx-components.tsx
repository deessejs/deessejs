import type { ReactNode } from "react"

import {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  List,
  InlineCode,
  Link,
  Strong,
  Em,
  Hr,
  Img,
  Table,
  THead,
  TBody,
  TR,
  TH,
  TD,
} from "@workspace/ui/components/typography"

/**
 * Adapter for the MDX runtime's `<pre>` emission. MDX-bundler emits
 * `<pre>` with the rehype-pretty-code output as its children (already
 * highlighted `<code><span>` tokens). This component renders the
 * incoming `<pre>` element inside the macOS-dots chrome.
 *
 * Title handling is intentionally absent for now: the MDX source has
 * no standard way to pass a per-block title, and the design accepts
 * an optional title that simply stays unset. Add it later by
 * parsing `data-title` (via a rehype plugin) or by introducing a
 * custom MDX `<CodeBlock title="…">` syntax.
 */
function MdxPre({ children }: { children?: ReactNode }) {
  return (
    <div className="bg-background w-full overflow-hidden rounded-none border border-border">
      <div className="flex items-center gap-1.5 border-b bg-muted/30 px-3 py-2">
        <div className="h-2.5 w-2.5 rounded-full bg-[#ff5f57]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#ffbd2e]" />
        <div className="h-2.5 w-2.5 rounded-full bg-[#28c840]" />
      </div>
      <div className="overflow-x-auto p-3 text-xs">{children}</div>
    </div>
  )
}

/**
 * Components map passed at runtime to <MDXContent components={...} />
 * so MDX-emitted elements render through our shared
 * @workspace/ui/typography primitives.
 *
 * The map covers every element MDX can emit from a plain Markdown
 * source. With this map, `Prose` no longer needs to attach
 * `[&_X]:` sibling selectors to a wrapper article.
 *
 * What is NOT in the map:
 * - `[data-highlighted-line]` / `[data-highlighted-chars]` — emitted
 *   by rehype-pretty-code with their own classes. They are styled
 *   by `MdxRenderer` itself via sibling selectors.
 * - `[data-rehype-pretty-code-figure]` — same reason.
 */
export const mdxComponents = {
  h1: H1,
  h2: H2,
  h3: H3,
  h4: H4,
  p: P,
  blockquote: Blockquote,
  ul: List,
  ol: List,
  code: InlineCode,
  pre: MdxPre,
  a: Link,
  strong: Strong,
  em: Em,
  hr: Hr,
  img: Img,
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: TR,
  th: TH,
  td: TD,
} as const
