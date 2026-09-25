/**
 * /manifesto page hero.
 *
 * Eyebrow + h1 + lead + meta <dl> row (Last updated · Beliefs ·
 * Reading time). The <dl> with grouped <div> wrappers is the
 * repo convention at `template-detail.tsx:201` and
 * `use-cases/ai-products/page.tsx:359` — valid in HTML5.2+.
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        The DeesseJS Manifesto
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
        Software that builds software.
      </h1>
      <p className="text-muted-foreground text-copy-20 leading-7 [&:not(:first-child)]:mt-0">
        Six beliefs that shape how we design templates, ship
        defaults, and think about the agentic era.
      </p>
      <dl className="flex flex-wrap items-center gap-x-6 gap-y-2 text-copy-13 text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <dt>Last updated</dt>
          <dd className="text-foreground">2026-08-04</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>Beliefs</dt>
          <dd className="text-foreground">6</dd>
        </div>
        <div className="flex items-center gap-1.5">
          <dt>Reading time</dt>
          <dd className="text-foreground">~ 5 min</dd>
        </div>
      </dl>
    </header>
  )
}
