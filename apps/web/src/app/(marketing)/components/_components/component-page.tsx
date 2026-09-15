import Link from "next/link"
import { ExternalLink } from "lucide-react"

import { H1 } from "@workspace/ui/components/typography"
import { Separator } from "@workspace/ui/components/separator"
import { Button } from "@workspace/ui/components/button"
import { Card } from "@workspace/ui/components/card"

import type { CatalogueComponent } from "./components-list"
import type { ComponentCategory } from "./categories"

type Props = {
  component: CatalogueComponent
  category: ComponentCategory
}

const COMPONENTS_REPO_URL =
  "https://github.com/deessejs/deessejs/tree/main/packages/ui/components"

/**
 * Shared body for every `/components/[category]/[component]` page.
 *
 * V1 dummy. The shape mirrors `/components` and
 * `/components/[category]`: hero with breadcrumbs, a placeholder
 * card, and a footer CTA pointing at the source. V2 replaces the
 * placeholder card with a tabbed preview/code/anatomy layout.
 */
export function ComponentPage({ component, category }: Props) {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-16 px-4 py-16 sm:px-6 lg:py-24">
      {/* Hero */}
      <header className="flex flex-col gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          {category.name}
        </p>
        <H1>{component.name}.</H1>
        <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
          {component.description}
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
              {component.name}
            </code>{" "}
            will land here. See the source file on GitHub in the
            meantime.
          </p>
          <Link
            href={`${COMPONENTS_REPO_URL}/${component.slug}.tsx`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-label-14 text-foreground inline-flex items-center gap-1 underline-offset-4 hover:underline self-start"
            aria-label={`Open ${component.name} source on GitHub (opens in a new tab)`}
          >
            Open {component.slug}.tsx on GitHub
            <ExternalLink className="size-3 shrink-0" aria-hidden />
          </Link>
        </Card>
      </section>

      <Separator />

      {/* Footer CTA — "back to the category" + "view on GitHub" */}
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
            All {category.name.toLowerCase()} primitives live in{" "}
            <code className="font-mono text-foreground/90">packages/ui</code>
            . MIT, no paywall.
          </p>
        </div>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button asChild variant="outline">
            <Link href={`/components/${category.slug}`}>
              Back to {category.name}
            </Link>
          </Button>
          <Button asChild>
            <a
              href={COMPONENTS_REPO_URL}
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