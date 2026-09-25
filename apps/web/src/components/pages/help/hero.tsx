/**
 * /help page hero.
 *
 * Single eyebrow + h1 + lead block. Matches the marketing hero scale
 * used by /enterprise, /delivery, /pricing, /homepage, and the four
 * other Company pages. See `tailwind-borders` skill for related
 * border recipes.
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-4">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Help
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
        How to get help.
      </h1>
      <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
        Self-serve first, ask later. Most questions are answered in the
        Knowledge Base or the Docs. If not, the team is reachable through
        the channels below.
      </p>
    </header>
  )
}
