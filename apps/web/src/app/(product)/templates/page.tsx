import type { Metadata } from "next"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { TEMPLATES } from "@workspace/api/templates-catalog"
import { Button } from "@workspace/ui/components/button"

import { FlickeringGrid } from "@/components/marketing/flickering-grid"
import { SUBMIT_TEMPLATE_URL } from "@/lib/templates/urls"
import { TemplatesBrowser } from "@/components/templates/templates-browser"

/**
 * Index page at /templates.
 *
 * Static render. The catalog and its metadata are read directly from
 * the local registry (`@workspace/api/templates-catalog`); the page
 * makes NO network call at request time.
 *
 * The body — sidebar + search + grid — is one client component
 * (`TemplatesBrowser`) so all filter UI shares a single URL-driven
 * state. The page only owns the static hero, the registry payload
 * passed to the browser surface, and the closing CTA.
 *
 * Why static:
 *   The registry is versioned in the repo; updates ship via a new
 *   build, not via a revalidation window. The previous design read
 *   `searchParams` server-side, which forced the page dynamic and
 *   re-introduced the runtime-fetch surface that produced the
 *   empty-catalog incident in the first place.
 *
 * Filter URL handling:
 *   Filtering happens client-side with `useSearchParams` inside the
 *   `TemplatesBrowser` Suspense boundary. The URL is the source of
 *   truth for shareable state. The initial server render paints
 *   the full grid (no filters applied) so the page is never empty
 *   before hydration.
 */

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Production-ready starters shipped by DeesseJS. Browse the registry and install with one command.",
}

const ALL_TEMPLATES: ReadonlyArray<Template> = TEMPLATES

const TemplatesIndexPage = () => {
  return (
    <>
      {/* Hero — centered FlickeringGrid header. */}
      <header className="relative overflow-hidden border-b border-border">
        <FlickeringGrid
          className="absolute inset-0 z-0 opacity-60"
          squareSize={3}
          gridGap={5}
          flickerChance={0.15}
          maxOpacity={0.18}
          color="rgb(120, 120, 120)"
        />
        <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
          <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
            Templates
          </p>
          <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
            Production-ready starters.
          </h1>
          <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
            Click any card to view details, or install from the CLI
            with <code>deessejs init &lt;slug&gt;</code>.
          </p>
        </div>
      </header>

      <TemplatesBrowser allTemplates={ALL_TEMPLATES} />

      {/* Trailing CTA mirroring the homepage shape. */}
      <a
        href={SUBMIT_TEMPLATE_URL}
        target="_blank"
        rel="noopener noreferrer"
        aria-label="Submit your template to the registry"
        className="flex flex-col items-start gap-3 rounded-none border-b border-border bg-background p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
      >
        <div className="flex flex-col gap-1">
          <span className="text-label-14 font-semibold tracking-tight text-foreground">
            Ship your template to the registry
          </span>
          <span className="text-copy-13 text-muted-foreground">
            Open a PR on deessejs/deessejs. Slug, category,
            and labels are collected via the form.
          </span>
        </div>
        <span className="text-label-14 text-foreground underline-offset-4 whitespace-nowrap group-hover:underline">
          Submit your template →
        </span>
      </a>

      {/* Final CTA — 2-col shared-border block. */}
      <div className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
        <div className="flex flex-col gap-4 p-6 lg:p-10">
          <p className="text-label-13 text-muted-foreground">
            Ready to ship?
          </p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            Browse the registry. Or ship with us.
          </h2>
          <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
            Install the CLI to scaffold a project in under five
            minutes, or talk to our delivery team if you need a
            hand. Same templates, same contracts, same guarantees.
          </p>
        </div>
        <div className="flex flex-col items-stretch justify-center gap-4 p-6 lg:p-10">
          <Button asChild size="lg">
            <Link href="/knowledge-base/guides/install-deessejs-cli">
              Install the CLI
              <ArrowRight className="size-3.5" aria-hidden />
            </Link>
          </Button>
          <Button variant="outline" size="lg" asChild>
            <Link href="/templates">Browse the registry</Link>
          </Button>
        </div>
      </div>
    </>
  )
}

export default TemplatesIndexPage
