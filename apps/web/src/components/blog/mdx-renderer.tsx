"use client"

import { MDXContent } from "@content-collections/mdx/react"

import { mdxComponents } from "./mdx-components"

/**
 * Runtime wrapper around <MDXContent>.
 *
 * - Passes the `mdxComponents` map so MDX-emitted elements
 *   (h1-h4, p, blockquote, ul, ol, code, a, strong, em, hr, img,
 *   table, thead, tbody, tr, th, td, pre) render through the
 *   shared @workspace/ui/typography primitives — including the
 *   macOS-dots code block chrome via the `MdxPre` adapter (which
 *   re-runs shiki at request time from the raw source extracted by
 *   rehype-mdx-code-props).
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
        "text-base leading-7 text-pretty space-y-6 [&>ul]:!mt-0 [&>ol]:!mt-0 [&>ul>li]:!mt-0 [&>ol>li]:!mt-0 [&_ul]:space-y-2 [&_ol]:space-y-2" +
        (className ? ` ${className}` : "")
      }
    >
      <MDXContent code={code} components={mdxComponents} />
    </article>
  )
}
