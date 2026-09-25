import type { Metadata } from "next"

import Link from "next/link"
import { ArrowRight } from "lucide-react"

import type { TemplateV1 } from "@workspace/contracts/v1"
import {
  CATEGORY_LABELS,
  FRAMEWORK_LABELS,
  type CategorySlug,
  type FrameworkSlug,
} from "@workspace/api/templates-labels"
import { Button } from "@workspace/ui/components/button"

import { FlickeringGrid } from "@/app/(marketing)/_components/flickering-grid"
import { liveCache, orpc } from "@/lib/orpc"
import { SUBMIT_TEMPLATE_URL } from "@/lib/templates/urls"
import { CategorySidebar } from "@/components/templates/category-sidebar"
import { SearchableTemplateGrid } from "@/components/templates/search-bar"

export const metadata: Metadata = {
  title: "Templates",
  description:
    "Production-ready starters shipped by DeesseJS. Browse the catalog and install with one command.",
}

/**
 * Index page at /templates.
 *
 * RSC: fetches the catalog server-side using `liveCache`
 * (revalidate: 0, tag `templates:live`) so a transient failure cannot
 * poison the Next.js data cache under a long-lived tag. On a runtime
 * error the request propagates to the segment's `error.tsx` client
 * boundary, which already renders a "Try again" state. We deliberately
 * do NOT swallow errors as `[]` here — that was the source of the
 * 10-minute pinned empty-state in issue #81.
 *
 * During `next build` (`NEXT_PHASE === "phase-production-build"`) the
 * API may not be reachable from the build worker. In that phase only,
 * we fall back to an empty list so the page can still be prerendered
 * without network access; production runtime always re-throws.
 *
 * Visual structure matches the marketing site (`/`, `/pricing`,
 * `/blog`, `/changelog`, `/knowledge-base`):
 *   - `<GlobalLayout>` (root layout) supplies the bordered card and
 *     the diagonal-stripe columns on xl.
 *   - The hero mirrors the centered FlickeringGrid header pattern
 *     shared with `/blog` and `/changelog`: eyebrow uppercase, H1
 *     scale `text-heading-40 → 56`, `text-balance` subtitle.
 *   - The body is a two-column shared-border grid: filter sidebar
 *     on the left, search + grid on the right, separated by
 *     `lg:divide-x divide-border`.
 *   - A final 2-col CTA closes the page (same shape as the homepage
 *     and the `(content)` layout's final block).
 *
 * Category and framework slug lists are derived from the canonical
 * `CATEGORY_LABELS` / `FRAMEWORK_LABELS` maps in `@workspace/api/templates-labels`
 * — single source of truth shared with `CategorySidebar`.
 */

const KNOWN_TYPES = Object.keys(CATEGORY_LABELS) as CategorySlug[]
const KNOWN_FRAMEWORKS = Object.keys(FRAMEWORK_LABELS) as FrameworkSlug[]

type FilterValue<T extends ReadonlyArray<string>> = T[number]

const dedupe = <T extends string>(
  values: ReadonlyArray<string>,
  allowed: ReadonlyArray<T>,
): Array<T> => {
  const set = new Set<T>(allowed)
  const out: Array<T> = []
  for (const v of values) {
    if (set.has(v as T)) {
      out.push(v as T)
    }
  }
  return Array.from(new Set(out))
}

const TemplatesIndexPage = async ({
  searchParams,
}: {
  searchParams: Promise<{
    type?: string | string[]
    framework?: string | string[]
  }>
}) => {
  let templates: TemplateV1[] = []
  try {
    const result = await orpc.templates.list(undefined, liveCache)
    // Defensive: `result.templates` may be undefined if the upstream
    // returns a malformed payload (the oRPC route handler already
    // defaults to `[]` in templates.ts, but the wire contract does
    // not enforce non-undefined). Coalesce here so the page never
    // blows up on `templates.length`. Matches the same defensive
    // pattern used in TemplateLabels (digest `551940582`).
    templates = result.templates ?? []
  } catch (error) {
    // Build-time fallback: when the build worker has no network
    // access to the API, swallow the error so the page can still be
    // prerendered. Production runtime always re-throws so the
    // segment's error.tsx renders. See issue #81.
    if (process.env.NEXT_PHASE === "phase-production-build") {
      templates = []
    } else {
      throw error
    }
  }

  // When the catalog is empty, render the empty state inside the
  // shared-border grid so the page still carries the GlobalLayout
  // framing — matches the layout other content pages ship with even
  // when they have no records (e.g. empty Knowledge Base).
  if (templates.length === 0) {
    return (
      <>
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

        <section
          data-testid="templates-empty"
          className="flex flex-col items-center justify-center border border-dashed border-border px-6 py-16 text-center"
        >
          <p className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            No templates
          </p>
          <p className="mt-3 max-w-md text-pretty text-base text-muted-foreground">
            The registry is empty right now. Try the CLI:{" "}
            <code className="text-copy-14-mono text-foreground">
              deessejs list
            </code>
            .
          </p>
        </section>
      </>
    )
  }

  const params = await searchParams
  const rawType = params.type
  const rawFramework = params.framework
  const rawTypes = Array.isArray(rawType) ? rawType : rawType ? [rawType] : []
  const rawFrameworks = Array.isArray(rawFramework)
    ? rawFramework
    : rawFramework
      ? [rawFramework]
      : []

  const activeTypes = dedupe(rawTypes, KNOWN_TYPES)
  const activeFrameworks = dedupe(rawFrameworks, KNOWN_FRAMEWORKS)

  const activeTypeSet = new Set<FilterValue<typeof KNOWN_TYPES>>(activeTypes)
  const visibleTemplates = templates.filter((template) => {
    const matchesType =
      activeTypes.length === 0 ||
      activeTypeSet.has(template.category as FilterValue<typeof KNOWN_TYPES>)
    const matchesFramework =
      activeFrameworks.length === 0 ||
      activeFrameworks.some((framework) => template.labels.includes(framework))
    return matchesType && matchesFramework
  })

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

      {/* Body — shared-border 2-col: filters left, grid right. The
          sidebar carries `p-6 md:p-8 lg:p-10` to match the canonical
          cell padding used by the homepage and pricing surfaces. */}
      <div className="border-b border-border">
        <div className="grid grid-cols-2 divide-y divide-border border-border lg:grid-cols-[18rem_minmax(0,1fr)] lg:divide-x lg:divide-y-0">
          <aside className="p-6 md:p-8 lg:p-10">
            <CategorySidebar
              templates={templates}
              activeTypes={activeTypes}
              activeFrameworks={activeFrameworks}
            />
          </aside>
          <div className="flex min-w-0 flex-col">
            {visibleTemplates.length === 0 ? (
              <div className="text-copy-16 text-muted-foreground">
                No templates in this filter yet.
              </div>
            ) : (
              <>
                <SearchableTemplateGrid
                  templates={visibleTemplates}
                  categoryLabel="the current filter"
                />
                <a
                  href={SUBMIT_TEMPLATE_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Submit your template to the registry"
                  className="flex flex-col items-start gap-3 rounded-lg border border-border bg-muted/30 p-4 transition-colors hover:bg-accent/30 sm:flex-row sm:items-center sm:justify-between"
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
              </>
            )}
          </div>
        </div>
      </div>

      {/* Final CTA — 2-col shared-border block. Same shape as the
          homepage's "Use the templates. Or ship with us." block and
          the `(content)` layout's final block, so visitors hit the
          same conversion lever regardless of which surface they
          arrived on. */}
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
