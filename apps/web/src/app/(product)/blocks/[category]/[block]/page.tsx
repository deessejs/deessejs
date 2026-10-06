import type { Metadata } from "next"
import { notFound } from "next/navigation"
import Link from "next/link"
import { ArrowLeft } from "lucide-react"

import { CatalogPreviewTabs } from "@/components/catalog/catalog-preview-tabs"
import { BlockPreview } from "@/components/catalog/blocks/preview"
import {
  getAllBlockParams,
  getBlock,
} from "@/components/catalog/blocks/catalogue"
import { getBlockSnippet } from "@/components/catalog/blocks/snippets"

const BLOCKS_REPO_URL = "https://github.com/deessejs/deessejs"

/**
 * /blocks/[category]/[block]
 *
 * Dynamic catch-all for the leaf of the blocks tree. Pre-renders
 * every known `(category, block)` pair from the catalogue; a pair
 * that does not exist returns 404.
 *
 * The category is validated against the block: a typo'd
 * `/blocks/hero/pricing-three-layer` (wrong category for the
 * slug) also returns 404 rather than rendering the wrong page.
 *
 * Pre-refactor: delegated to `BlockPage`. The body — back link,
 * hero, and tabbed preview — is inlined here.
 */
type Params = { category: string; block: string }

export function generateStaticParams(): Array<Params> {
  return getAllBlockParams()
}

export function generateMetadata({
  params,
}: {
  params: Promise<Params>
}): Promise<Metadata> {
  return params.then(({ block }) => {
    const match = getBlock(block)
    if (!match) return { title: "Block not found" }
    return {
      title: `${match.name} — Blocks`,
      description: match.description,
    }
  })
}

export default async function BlockRoute({
  params,
}: {
  params: Promise<Params>
}) {
  const { category, block } = await params
  const match = getBlock(block)
  // Either the slug is unknown, or the (category, block) pair
  // does not match the catalogue. Both → 404.
  if (!match || match.category !== category) notFound()

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
            {match.name}.
          </h1>
          <p className="max-w-2xl text-pretty text-lg text-muted-foreground [&:not(:first-child)]:mt-0">
            {match.description}
          </p>
        </div>
      </header>

      {/* Tabbed Preview / Code + inline install command */}
      <section
        aria-label={`${match.name} preview`}
        className="px-6 pb-12 lg:px-10"
      >
        <CatalogPreviewTabs
          slug={match.slug}
          itemName={match.name}
          itemKind="block"
          sourceRepoUrl={BLOCKS_REPO_URL}
          snippet={getBlockSnippet(match.slug)}
          preview={<BlockPreview block={match} />}
        />
      </section>
    </>
  )
}
