import Link from "next/link"
import { ArrowRight } from "lucide-react"

/**
 * `RelatedUseCases` — the closing cross-link band that appears on
 * every use-case page below the cluster section and above the
 * FinalCta shell.
 *
 * The shell (header band + 6-col grid + 3-card link grid +
 * `ArrowRight` "Read more" affordance) is byte-identical across
 * all 7 pages; only the items differ. The data shape is fixed
 * here so the link target is computed once (`/use-cases/${slug}`)
 * and the renderer stays a pure presentation component.
 *
 * Items are screen-local `const RELATED = [...]` literals in each
 * page. We do NOT centralize the list of use-cases here on
 * purpose: the cross-link graph is hand-tuned per page and
 * evolves with the editorial narrative, not as a generic graph.
 */
export type RelatedUseCaseItem = {
  slug: string
  title: string
  tagline: string
}

export function RelatedUseCases({
  items,
}: {
  items: ReadonlyArray<RelatedUseCaseItem>
}) {
  return (
    <div className="grid grid-cols-1 border-t border-border lg:grid-cols-6 lg:divide-x lg:divide-border">
      <div className="flex flex-col gap-3 justify-center p-6 lg:col-span-1 lg:p-10">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Explore
        </p>
        <h2 className="max-w-2xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Related use cases.
        </h2>
      </div>
      <div className="grid grid-cols-1 divide-y divide-border lg:col-span-5 !p-0 border-0 md:grid-cols-3 md:divide-x md:divide-y-0">
        {items.map((item) => (
          <Link
            key={item.slug}
            href={`/use-cases/${item.slug}`}
            className="group flex flex-col gap-2 p-6 transition-colors hover:bg-accent/40 lg:p-8"
          >
            <p className="text-label-13 text-muted-foreground">Related</p>
            <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
              {item.title}
            </h3>
            <p className="line-clamp-3 text-copy-14 leading-6 text-muted-foreground">
              {item.tagline}
            </p>
            <p className="inline-flex items-center gap-1 pt-1 text-label-13 text-foreground">
              Read more
              <ArrowRight
                className="size-3 transition-transform group-hover:translate-x-0.5"
                aria-hidden
              />
            </p>
          </Link>
        ))}
      </div>
    </div>
  )
}