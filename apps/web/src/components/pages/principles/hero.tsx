import Link from "next/link"

/**
 * /principles page hero.
 *
 * Standardized hero recipe used across the 5 light Company pages.
 * See `apps/web/src/components/pages/about/hero.tsx` for the full
 * recipe rationale.
 *
 * No meta row on /principles (operational rules, not time-bound).
 * The lead paragraph contains an inline <Link> back to /manifesto
 * (manifesto = why, principles = how — sequential reading).
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        How we work
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
        Principles.
      </h1>
      <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
        The day-to-day operating rules that complement the
        {" "}<Link href="/manifesto" className="underline-offset-4 hover:underline text-foreground">manifesto</Link>. Most of them
        were earned the hard way.
      </p>
    </header>
  )
}
