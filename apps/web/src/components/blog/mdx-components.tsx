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

import { CodeBlock } from "./code-block"

/**
 * MDX runtime adapter for `<pre>` elements.
 *
 * Receives the props that the build-time `rehypeStoreRawCode` plugin
 * (apps/web/content-collections.ts) attaches to every `<pre>`:
 *   - `code`        : the raw source of the fenced block
 *   - `language`    : the language tag, when one was inferred from the
 *                      info-string (````ts`, ````bash`, …)
 *   - `title`       : optional — when the fenced block had
 *                      metadata like ````ts title="x"`
 *
 * Delegates the actual highlighting to <CodeBlock> so the runtime
 * stays the single source of truth for shiki output. <CodeBlock> is
 * an async server component, which is fine here: MDX runtime runs in
 * a server component (every page that uses <MdxRenderer> is a server
 * component), and React 19 + Next.js 16 stream the async boundary
 * correctly.
 *
 * If the props are missing (e.g. the rehype plugin was bypassed for
 * a test, or someone hand-wrote <pre> in MDX), we fall back to a
 * plain <pre><code> so the page still renders.
 */
function MdxPre(props: {
  children?: ReactNode
  code?: string
  language?: string
  title?: string
}) {
  if (typeof props.code === "string") {
    // exactOptionalPropertyTypes: true on CodeBlock — omit the key
    // when undefined instead of writing `language: undefined`.
    const blockProps: React.ComponentProps<typeof CodeBlock> = {
      code: props.code,
      size: "sm",
    }
    if (props.language !== undefined) blockProps.language = props.language
    if (props.title !== undefined) blockProps.title = props.title
    return <CodeBlock {...blockProps} />
  }
  return (
    <pre className="bg-background w-full overflow-x-auto rounded-md border border-border p-4 font-mono text-sm">
      <code className="font-mono">{props.children}</code>
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
