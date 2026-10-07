import Link from "next/link"

export type RelatedLink = {
  label: string
  href: string
  body: string
  /**
   * External links get `target="_blank" rel="noopener noreferrer"`.
   * Defaults to false so callers don't have to think about it.
   */
  external?: boolean
}

export type RelatedLinksProps = {
  /** 2–4 items. */
  links: ReadonlyArray<RelatedLink>
  /** Override the default "Read next" heading. */
  heading?: string
}

/**
 * Shared "Read next" nav used at the bottom of public pages.
 *
 * Renders a 1 / 2 / 4-col grid (mobile / sm / lg) of link cards.
 * The card shape is the same one used by the four Company pages
 * (`/about`, `/manifesto`, `/principles`, `/vision`) and duplicated
 * inline six times across the codebase — extracted here so a future
 * tweak (color, padding, hover style) propagates everywhere.
 *
 * Design notes:
 *
 * - The heading is a raw `<h2>` with `text-heading-24` from the
 *   marketing scale, **not** the package `<H2>` from
 *   `@workspace/ui/components/typography`. The package's `<H2>`
 *   includes `border-b pb-2`, which would draw a second horizontal
 *   rule immediately below the caller's preceding `<Separator />`.
 *
 * - This component does NOT render a `<Separator />` above the
 *   heading. The separator is a page-level rhythm decision and
 *   stays at the call site. Future callers can choose to omit it.
 *
 * - `external?: boolean` because `/help`'s related links include
 *   `https://docs.deessejs.com`, which must open in a new tab with
 *   `noopener noreferrer`.
 *
 * Sibling to `_shared/final-cta.tsx`, which follows the same
 * "configurable presentational shell" convention (`noBorderB` prop
 * there, `heading` prop here).
 */
export function RelatedLinks({
  links,
  heading = "Read next",
}: RelatedLinksProps) {
  return (
    <nav aria-label="Related pages" className="flex flex-col gap-6">
      <h2 className="text-heading-24 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        {heading}
      </h2>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {links.map((link) => (
          <Link
            key={link.label}
            href={link.href}
            target={link.external ? "_blank" : undefined}
            rel={link.external ? "noopener noreferrer" : undefined}
            className="flex flex-col gap-1 rounded-lg border border-border p-4 transition-colors hover:bg-accent/30"
          >
            <span className="text-label-14 font-semibold text-foreground">
              {link.label}
            </span>
            <span className="text-copy-13 text-muted-foreground">
              {link.body}
            </span>
          </Link>
        ))}
      </div>
    </nav>
  )
}
