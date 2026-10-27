/**
 * /help page hero.
 *
 * Standardized hero recipe used across the 5 light Company pages.
 * See `apps/web/src/components/pages/about/hero.tsx` for the full
 * recipe rationale.
 *
 * No meta row on /help (it's evergreen content, not time-bound).
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 tracking-wider text-muted-foreground uppercase">
        Help
      </p>
      <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
        How to get help.
      </h1>
      <p className="max-w-2xl text-copy-18 leading-7 text-balance text-muted-foreground sm:text-copy-20 [&:not(:first-child)]:mt-0">
        Self-serve first, ask later. Most questions are answered in the
        Knowledge Base or the Docs. If not, the team is reachable through the
        channels below.
      </p>
    </header>
  )
}
