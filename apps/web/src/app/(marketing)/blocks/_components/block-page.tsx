import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"

import type { CatalogueBlock } from "./blocks-list"
import type { BlockCategory } from "./block-categories"
import { getBlockIcon } from "./block-icon"

type Props = {
  block: CatalogueBlock
  category: BlockCategory
}

const BLOCKS_REPO_URL = "https://github.com/deessejs/deessejs"

/**
 * Shared body for `/blocks/[category]/[block]`.
 *
 * V1 dummy: hero with eyebrow (category), H1 (block name), lead
 * (description) + a placeholder card that mentions the `layout`
 * discriminator + a two-button footer ("Back to category" +
 * "View on GitHub").
 *
 * V2 will replace the placeholder with a tabbed layout
 * (Preview / Code / Anatomy), mirroring the
 * `ComponentPage` V2 roadmap.
 */
export function BlockPage({ block, category }: Props) {
  const Icon = getBlockIcon(block.slug)

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

      {/* Placeholder. Replaced by tabs (Preview / Code / Anatomy) in V2. */}
      <section
        aria-labelledby="catalogue-heading"
        className="flex flex-col gap-4"
      >
        <h2 id="catalogue-heading" className="text-heading-32 tracking-tight">
          The catalogue is in progress.
        </h2>
        <Card className="flex flex-col gap-4 p-6">
          <p className="text-copy-16 text-foreground leading-7 [&:not(:first-child)]:mt-0">
            Live preview, code, and anatomy for{" "}
            <code className="bg-muted relative rounded px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold">
              {block.name}
            </code>{" "}
            will land here. The V1 placeholder shows the layout
            discriminator and the visual marker for the
            block.
          </p>
          <div className="flex flex-wrap items-center gap-3">
            <span
              aria-hidden
              className="flex size-12 shrink-0 items-center justify-center rounded-md border border-border bg-background"
            >
              <Icon className="size-6 text-muted-foreground" />
            </span>
            <span className="text-label-13 text-muted-foreground">
              Layout:{" "}
              <span className="font-mono text-foreground/90">
                {block.layout}
              </span>
              {" · "}
              Category:{" "}
              <span className="font-mono text-foreground/90">
                {block.category}
              </span>
            </span>
          </div>
        </Card>
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