import type { Metadata } from "next"
import { notFound } from "next/navigation"

import { BlockPage } from "@/app/(marketing)/blocks/_components/block-page"
import {
  getAllBlockParams,
  getBlock,
} from "@/app/(marketing)/blocks/_components/blocks-list"
import { getBlockCategory } from "@/app/(marketing)/blocks/_components/block-categories"

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
  const categoryMatch = getBlockCategory(category)
  if (!categoryMatch) notFound()
  return <BlockPage block={match} category={categoryMatch} />
}