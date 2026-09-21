"use client"

import { MDXContent } from "@content-collections/mdx/react"

import { mdxComponents } from "./mdx-components"

/**
 * Runtime wrapper around <MDXContent>.
 *
 * - Passes the `mdxComponents` map so MDX-emitted elements
 *   (h1-h4, p, blockquote, ul, ol, code, a, strong, em, hr, img,
 *   table, thead, tbody, tr, th, td, **pre**) render through the
 *   shared @workspace/ui/typography primitives — including the
 *   macOS-dots code block chrome via the `MdxPre` adapter.
 * - Wraps the content in an <article> with the small set of
 *   sibling selectors that cannot be overridden via the components
 *   map. Today that means only the shiki highlight data attributes
 *   on inline spans (`[data-highlighted-line]`,
 *   `[data-highlighted-chars]`).
 *
 * Replaces the previous `<Prose>` wrapper entirely — see
 * `mdx-components.tsx` for the rationale.
 */
export function MdxRenderer({
  code,
  id,
  className,
}: {
  code: string
  id?: string
  className?: string
}) {
  return (
    <article
      id={id}
      className={
        "text-base leading-7 text-pretty [&_[data-highlighted-line]]:bg-foreground/5 [&_[data-highlighted-line]]:relative [&_[data-highlighted-chars]]:bg-foreground/10 [&_[data-highlighted-chars]]:rounded" +
        (className ? ` ${className}` : "")
      }
    >
      <MDXContent code={code} components={mdxComponents} />
    </article>
  )
}
