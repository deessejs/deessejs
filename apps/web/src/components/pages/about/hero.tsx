/**
 * /about page hero.
 *
 * Single eyebrow + h1 + lead block. Matches the marketing hero scale
 * used by /enterprise, /delivery, /pricing, /homepage, and the four
 * other Company pages.
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-4 ">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        About
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
        The main app.
      </h1>
      <p className="text-muted-foreground text-copy-20 leading-7 max-w-3xl [&:not(:first-child)]:mt-0">
        DeesseJS is the main app of the deessejs organization —
        the surface that holds the templates, the contracts, the
        tools, and the team&apos;s voice in one place. This page
        is the short version of who edits it, and how to reach
        us.
      </p>
    </header>
  )
}
