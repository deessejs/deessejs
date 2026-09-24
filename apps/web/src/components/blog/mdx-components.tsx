import type { ComponentProps, ReactNode } from "react"

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
 * Shiki runs at build time inside the content-collections pipeline
 * (`@shikijs/rehype` with theme="github-dark"). The resulting HTML
 * already carries the .shiki class, the theme variable, and the
 * per-token inline `color` styles — we just need to wrap it so the
 * visitor sees a border, padding, and a horizontal scroll on
 * overflow. Spreading `{...props}` is what makes this work: the
 * rehype-emitted className, style, and children all pass through.
 *
 * Adding a fresh <code> here would nest inside the shiki-emitted
 * <code><span>…</span></code> tree, which is why the previous
 * <pre><code>{children}</code></pre> shape broke colors (the inner
 * code ate the inline style of the shiki tokens).
 */
function MdxPre(props: ComponentProps<"pre">) {
  return (
    <div className="w-full overflow-hidden rounded-md border border-border">
      <div className="overflow-x-auto p-4 text-sm">
        <pre {...props} />
      </div>
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
