/**
 * /vision page hero.
 *
 * Standardized hero recipe used across the 5 light Company pages.
 * See `apps/web/src/components/pages/about/hero.tsx` for the full
 * recipe rationale.
 *
 * Has a "Last updated" `<p>` row below the lead. /vision is the
 * only Company page with this temporal marker (the others are
 * evergreen). The hero wrapper keeps gap-6 throughout so the
 * timestamp sits 24px below the lead.
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Where we&apos;re going
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
        Vision.
      </h1>
      <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
        Three horizons for the DeesseJS main app: what&apos;s
        shipping today, what we&apos;re building toward next,
        and where we want to land eventually. Revised as the
        roadmap moves.
      </p>
      <p className="text-copy-13 text-muted-foreground [&:not(:first-child)]:mt-0">
        Last updated: 2026-08-04.
      </p>
    </header>
  )
}
