import type { ReactNode } from "react"

import {
  H1,
  H2,
  H3,
  H4,
  P,
  Blockquote,
  List,
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
 * MDX runtime adapter for `<pre>` elements.
 *
 * Renders the shiki-highlighted `<pre>` block (produced by the
 * build-time rehype pipeline) inside the macOS-dots chrome without
 * re-running shiki at request time. The shiki output is already
 * fully styled; we only add a window frame and the traffic-light
 * dots around it.
 *
 * The optional `title` prop comes from the rehype store-code plugin
 * (when the markdown fenced block had metadata like
 * ````ts title="x"`); defaults to undefined.
 */
function MdxPre({
  children,
}: {
  children?: ReactNode
}) {
  return (
    <pre className="bg-background w-full overflow-x-auto rounded-md border border-border p-4 font-mono text-sm">
      <code className="font-mono">{children}</code>
    </pre>
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
