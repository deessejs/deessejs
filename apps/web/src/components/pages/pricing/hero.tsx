/**
 * Pricing hero — proposition centrée.
 *
 * Mirrors the homepage hero shape but without the FlickeringGrid (the
 * pricing page is heavier in data density; a quieter hero keeps the
 * tier cards as the visual anchor).
 */
export function Hero() {
  return (
    <div className="flex flex-col items-center gap-3 border-b border-border px-6 py-16 text-center sm:py-20 lg:py-24">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Pricing
      </p>
      <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
        The catalog your agent can navigate.
      </h1>
      <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
        One payment for the catalog. Every template, every update,
        every project you ship, solo or as a team. MIT for the
        foundation, Professional for production, Team for agencies.
      </p>
    </div>
  )
}
