import type { Metadata } from "next"

import type { TemplateV1 } from "@workspace/contracts/v1"

import { liveCache, orpc } from "@/lib/orpc"
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
 * The empty-state branch below still applies, but only to a
 * successful fetch that legitimately returned no templates.
 */

const KNOWN_TYPES = ["saas", "ai", "landing"] as const
// Frameworks surface from labels on the registry. Add new frameworks
// here (and the matching templates in `packages/api/src/templates.ts`)
// to expose them in the sidebar.
const KNOWN_FRAMEWORKS = [
  "nextjs",
  "astro",
  "tailwind",
  "shadcn",
  "drizzle",
  "postgres",
  "stripe",
  "tanstack-table",
  "openai",
  "react-hook-form",
] as const

/**
 * Deep link to the GitHub "Add Template" Issue Template. Used by
 * the "Submit your template" CTAs on /templates and
 * /templates/[slug]. The labels=template query string tags the
 * issue for triage; everything else comes from the form.
 */
const SUBMIT_TEMPLATE_URL =
  "https://github.com/deessejs/deessejs/issues/new?template=add-template.yml&labels=template"

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
    templates = result.templates
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

  if (templates.length === 0) {
    return (
      <section
        data-testid="templates-empty"
        className="mx-auto max-w-6xl px-6 py-24"
      >
        <h1 className="text-heading-32 tracking-tight">Templates</h1>
        <p className="text-copy-16 text-muted-foreground mt-4">
          No templates available right now. Try the CLI:
          <code className="text-copy-14-mono ml-2">deessejs list</code>
        </p>
      </section>
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

  const visibleTemplates = templates.filter((template) => {
    const matchesType =
      activeTypes.length === 0 ||
      activeTypes.includes(
        template.category as FilterValue<typeof KNOWN_TYPES>,
      )
    const matchesFramework =
      activeFrameworks.length === 0 ||
      activeFrameworks.some((framework) => template.labels.includes(framework))
    return matchesType && matchesFramework
  })

  return (
    <section className="mx-auto max-w-6xl px-6 py-16">
      <header className="mb-10 flex flex-col gap-3">
        <h1 className="text-heading-56 tracking-tight">Templates</h1>
        <p className="text-copy-16 text-muted-foreground max-w-2xl">
          Production-ready starters shipped by DeesseJS. Click any card to
          view details, or install from the CLI with{" "}
          <code className="text-copy-14-mono">deessejs init &lt;slug&gt;</code>.
        </p>
      </header>

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[14rem_minmax(0,1fr)] lg:gap-12">
        <CategorySidebar
          templates={templates}
          activeTypes={activeTypes}
          activeFrameworks={activeFrameworks}
        />
        <div className="flex min-w-0 flex-1 flex-col gap-8">
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
    </section>
  )
}

export default TemplatesIndexPage