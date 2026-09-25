import Link from "next/link"

/**
 * /principles page hero.
 *
 * Eyebrow + h1 + lead paragraph that links back to /manifesto
 * (the philosophical counterpart to this operational page).
 */
export function Hero() {
  return (
    <header className="flex flex-col gap-6">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        How we work
      </p>
      <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
        Principles.
      </h1>
      <p className="text-muted-foreground text-copy-20 leading-7 max-w-2xl [&:not(:first-child)]:mt-0">
        The day-to-day operating rules that complement the
        {" "}<Link href="/manifesto" className="underline-offset-4 hover:underline text-foreground">manifesto</Link>. Most of them
        were earned the hard way.
      </p>
    </header>
  )
}
