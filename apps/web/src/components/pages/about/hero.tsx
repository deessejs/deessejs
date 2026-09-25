/**
 * /about page hero.
 *
 * Centered hero matching the recipe used by /pricing and
 * /enterprise: outer wrapper `flex flex-col items-center gap-6
 * border-b border-border p-6 text-center lg:p-16` (or
 * `px-6 py-16 sm:py-20 lg:py-24` for the pricing rhythm — we
 * adopt the pricing variant here, scaled for /about's weight),
 * with a `max-w-3xl` inner column that holds the H1, eyebrow,
 * and lead. The lead is `max-w-2xl` text-balance inside the
 * `max-w-3xl` column.
 *
 * Eyebrow `text-label-13 uppercase tracking-wider
 * text-muted-foreground`. H1 `text-heading-40 sm:text-heading-48
 * lg:text-heading-56 font-medium tracking-tight text-balance`.
 * Lead `text-muted-foreground text-copy-18 sm:text-copy-20
 * leading-7 max-w-2xl text-balance`.
 *
 * No meta row on /about (evergreen copy, not time-bound).
 *
 * Same recipe is used for /help and the other 4 Company hero
 * variants (commit `419eee9` standardized the inner classes;
 * this commit re-orients the wrapper from `flex flex-col gap-6`
 * to the centered `flex flex-col items-center gap-6` plus the
 * `max-w-3xl` inner column).
 */
export function Hero() {
  return (
    <section className="flex flex-col items-center gap-6 border-b border-border px-6 py-16 text-center sm:py-20 lg:py-24">
      <div className="flex max-w-3xl flex-col items-center gap-6">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          About
        </p>
        <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance">
          The main app.
        </h1>
        <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
          DeesseJS is the main app of the deessejs organization —
          the surface that holds the templates, the contracts, the
          tools, and the team&apos;s voice in one place. This page
          is the short version of who edits it, and how to reach
          us.
        </p>
      </div>
    </section>
  )
}
