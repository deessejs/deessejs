"use client"

import { MDXContent } from "@content-collections/mdx/react"

export function MdxRenderer({ code }: { code: string }) {
  return <MDXContent code={code} />
}
