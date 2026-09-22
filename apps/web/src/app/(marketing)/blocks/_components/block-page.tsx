import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import type { CatalogueBlock } from "./blocks-list"
import { BlockPreviewTabs } from "./block-preview-tabs"

type Props = {
  block: CatalogueBlock
}

/**
 * Shared body for `/blocks/[category]/[block]`.
 *
 * Wrapper + final CTA from `(marketing)/blocks/layout.tsx`.
 * Mirror of `ComponentPage` in the components registry.
 *
 * The install command lives inside `BlockPreviewTabs` (inline in
 * the tabset header row, to the left of the Source button) so
 * the visitor sees the CLI command as a top-level affordance
 * without switching tabs.
 */
export function BlockPage({ block }: Props) {
  return (
    <>
      {/* Back to blocks */}
      <div className="px-6 pt-12 lg:px-10">
        <Link
          href="/blocks"
          className="inline-flex items-center gap-1 text-copy-14 text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="size-3" aria-hidden />
          Back to blocks
        </Link>
      </div>

      {/* Hero */}
      <header className="px-6 pb-12 pt-6 lg:px-10">
        <div className="flex flex-col gap-3">
          <h1 className="text-4xl font-bold tracking-tighter text-balance sm:text-5xl">
            {block.name}.
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground [&:not(:first-child)]:mt-0">
            {block.description}
          </p>
        </div>
      </header>

      {/* Tabbed Preview / Code + inline install command */}
      <section
        aria-label={`${block.name} preview`}
        className="px-6 pb-12 lg:px-10"
      >
        <BlockPreviewTabs block={block} />
      </section>
    </>
  )
}