/**
 * /vision page hero.
 *
 * Eyebrow + h1 + lead paragraph + "Last updated" timestamp. The
 * timestamp is a <p> inside the header — same shape as the
 * manifesto's meta <dl> row, but a single line, so a plain
 * muted-foreground paragraph reads cleaner.
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        Where we&apos;re going
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
        Vision.
      </h1>
      <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
        Three horizons for the DeesseJS main app: what&apos;s
        shipping today, what we&apos;re building toward next,
        and where we want to land eventually. Revised as the
        roadmap moves.
      </p>
      <p className="text-copy-13 text-muted-foreground">
        Last updated: 2026-08-04.
      </p>
    </header>
  )
}
