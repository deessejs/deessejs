/**
 * /about page hero.
 *
 * Standardized hero recipe used across the 5 light Company pages
 * (about, help, manifesto, principles, vision):
 *
 * - Outer wrapper `flex flex-col gap-6 border-b border-border
 *   py-16 md:py-20 lg:py-24` — matches
 *   `apps/web/src/components/pages/enterprise/hero.tsx:15`,
 *   `delivery/hero.tsx:10`, `pricing/hero.tsx:10`,
 *   `homepage/hero.tsx:25`.
 * - Eyebrow `text-label-13 uppercase tracking-wider
 *   text-muted-foreground`.
 * - H1 `text-heading-40 sm:text-heading-48 lg:text-heading-56
 *   font-medium tracking-tight text-balance` — same responsive
 *   ramp as the four reference heroes.
 * - Lead `text-muted-foreground text-copy-18 sm:text-copy-20
 *   leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0`.
 *   text-balance applied to the lead (was missing on the company
 *   heroes) so the last line never wraps tight on narrow
 *   viewports.
 *
 * The page-level route wraps the hero in a div that carries the
 * `border-b border-border`; the hero component itself does not,
 * because that would produce a double border where the next
 * section's border starts. The wrapper-level border belongs to
 * the page; the section-level rhythm belongs to the section.
 *
 * No meta row on /about (it's evergreen copy, not time-bound).
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        About
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
        The main app.
      </h1>
      <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
        DeesseJS is the main app of the deessejs organization —
        the surface that holds the templates, the contracts, the
        tools, and the team&apos;s voice in one place. This page
        is the short version of who edits it, and how to reach
        us.
      </p>
    </header>
  )
}
