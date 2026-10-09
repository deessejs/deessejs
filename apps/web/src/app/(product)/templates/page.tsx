import type { Metadata } from "next"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { TemplateV1 as Template } from "@workspace/contracts/v1"
import { TEMPLATES } from "@workspace/api/templates-catalog"
import { Button } from "@workspace/ui/components/button"

import { FlickeringGrid } from "@/components/marketing/flickering-grid"
import { SUBMIT_TEMPLATE_URL } from "@/lib/templates/urls"
import { TemplatesBrowser } from "@/components/templates/templates-browser"
import { CategorySidebar } from "@/components/templates/category-sidebar"

/**
 * Index page at /templates.
 *
 * Static render. The catalog and its metadata are read directly from
 * the local registry (`@workspace/api/templates-catalog`); the page
 * makes NO network call at request time. Filtering, search, and URL
 * sync happen client-side in `TemplatesBrowser`. The full grid is
 * shipped in the initial HTML so the page is usable without
 * JavaScript.
 *
 * Why static and not ISR / dynamic:
 *   - The registry is versioned in the repo; updates ship via a new
 *     build, not via a revalidation window.
 *   - Dynamic rendering with `searchParams` reading on the server
 *     was the source of the catalog-empty incident: a transient
 *     GitHub failure surfaced as a missing catalog.
 *   - The Next.js / oRPC transport previously collapsed 4xx/5xx into
 *     200 (spread-Response bug in `mountRpc`). Even with that
 *     fixed, an oRPC catalogue that depends on GitHub can never be
 *     more reliable than GitHub. Moving the source-of-truth into
 *     the repo removes that whole class of failure.
 *
 * Filter URL handling:
 *   Filtering previously relied on reading `searchParams` on the
 *   server, which forced the page dynamic and re-introduced the
 *   runtime-fetch surface. The new design lets `TemplatesBrowser`
 *   read query params with `useSearchParams` inside a Suspense
 *   boundary, while the outer page stays purely static — the
 *   initial server render paints the entire catalog and lets the
 *   browser apply filters without a network round-trip.
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
      {/* Hero — centered FlickeringGrid header matching /blog and
          /changelog. Eyebrow + scale H1 + balanced subtitle. */}
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

      {/* Body — shared-border 2-col: filters left, grid right. */}
      <div className="border-b border-border">
        <div className="grid grid-cols-2 divide-y divide-border border-border lg:grid-cols-[18rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
          <aside className="p-6 md:p-8 lg:p-10">
            <CategorySidebar
              templates={[...ALL_TEMPLATES]}
              activeTypes={[]}
              activeFrameworks={[]}
            />
          </aside>
          <div className="flex min-w-0 flex-col">
            <TemplatesBrowser allTemplates={ALL_TEMPLATES} />
            <a
              href={SUBMIT_TEMPLATE_URL}
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Submit your template to the registry"
              className="flex flex-col items-start gap-3 rounded-none border-t border-border bg-background p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
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
          </div>
        </div>
      </div>

      {/* Final CTA — 2-col shared-border block. Same shape as the
          homepage's "Use the templates. Or ship with us." block
          and the `(content)` layout's final block, so visitors hit
          the same conversion lever regardless of which surface
          they arrived on. */}
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
