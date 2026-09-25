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
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Help
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
        How to get help.
      </h1>
      <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
        Self-serve first, ask later. Most questions are answered in the
        Knowledge Base or the Docs. If not, the team is reachable through
        the channels below.
      </p>
    </header>
  )
}
