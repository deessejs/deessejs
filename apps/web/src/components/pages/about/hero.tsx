/**
 * /about page hero.
 *
 * The hero itself owns its outer wrapper — `border-b border-border
 * py-16 md:py-20 lg:py-24` plus inner `px-4 md:px-6`. This
 * matches the pattern used by every other marketing hero in
 * the app (`enterprise/hero.tsx:15`, `delivery/hero.tsx:10`,
 * `pricing/hero.tsx:10`, `homepage/hero.tsx:35-58`): each
 * section is its own full-width block, the section-to-section
 * divider is the section's own `border-b`, and the route file
 * is a flat list of named namespace mounts.
 *
 * Inside the hero: `flex flex-col gap-6 border-b border-border
 * py-16 md:py-20 lg:py-24 px-4 md:px-6` carries the standard
 * recipe. The page-level `<div className="max-w-5xl">` wrapper
 * used to live above this — removed in the commit that
 * restructured /about to match delivery/enterprise.
 *
 * Eyebrow `text-label-13 uppercase tracking-wider
 * text-muted-foreground`. H1 `text-heading-40 sm:text-heading-48
 * lg:text-heading-56 font-medium tracking-tight text-balance`.
 * Lead `text-muted-foreground text-copy-18 sm:text-copy-20
 * leading-7 max-w-2xl text-balance`.
 *
 * No meta row on /about (evergreen copy, not time-bound).
 */
export function Hero() {
  return (
    <section className="flex flex-col gap-6 border-b border-border py-16 px-4 md:px-6 md:py-20 lg:py-24">
      <header className="flex flex-col gap-6 text-center lg:text-left">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          About
        </p>
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
          The main app.
        </h1>
        <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl mx-auto lg:mx-0 text-balance [&:not(:first-child)]:mt-0">
          DeesseJS is the main app of the deessejs organization —
          the surface that holds the templates, the contracts, the
          tools, and the team&apos;s voice in one place. This page
          is the short version of who edits it, and how to reach
          us.
        </p>
      </header>
    </section>
  )
}
