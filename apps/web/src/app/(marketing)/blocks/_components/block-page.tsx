import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"
import { Button } from "@workspace/ui/components/button"

import type { CatalogueBlock } from "./blocks-list"
import type { BlockCategory } from "./block-categories"
import { BlockPreviewTabs } from "./block-preview-tabs"

type Props = {
  block: CatalogueBlock
  category: BlockCategory
}

const BLOCKS_REPO_URL = "https://github.com/deessejs/deessejs"

/**
 * Shared body for `/blocks/[category]/[block]`.
 *
 * Layout: hero with breadcrumbs, tabbed Preview/Code surface
 * (with GitHub source button), footer CTA. Mirror of
 * `ComponentPage` in the components registry.
 */
export function BlockPage({ block, category }: Props) {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <H1>{block.name}.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {block.description}
        </p>
      </header>

      <Separator />

      {/* Tabbed Preview / Code */}
      <section
        aria-label={`${block.name} preview`}
        className="flex flex-col gap-4"
      >
        <BlockPreviewTabs block={block} />
      </section>

      <Separator />

      {/* Footer CTA — "back to category" + "view on GitHub" */}
      <section
        aria-labelledby="cta-heading"
        className="flex flex-col items-start gap-6 rounded-lg border border-border bg-muted/30 p-8 md:flex-row md:items-center md:justify-between"
      >
        <div className="flex flex-col gap-2">
          <h2
            id="cta-heading"
            className="text-heading-24 tracking-tight text-foreground !m-0"
          >
            Browse the {category.name.toLowerCase()} catalogue.
          </h2>
          <p className="text-copy-14 text-muted-foreground [&:not(:first-child)]:mt-0">
            All {category.name.toLowerCase()} blocks live in the
            DeesseJS monorepo. MIT, no paywall.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/blocks/${category.slug}`}>
              Back to {category.name}
            </Link>
          </Button>
          <Button asChild>
            <a
              href={BLOCKS_REPO_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
              <ExternalLink className="size-3.5" aria-hidden />
            </a>
          </Button>
        </div>
      </section>
    </article>
  )
}