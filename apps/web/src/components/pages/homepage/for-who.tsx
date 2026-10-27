import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Section } from "@/components/marketing/section"
import { PERSONAS } from "@/lib/marketing/home-data"

/** Who it's for — 3-cell persona grid, each card routes to a real surface. */
export function ForWho() {
  return (
    <Section className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
      <div className="col-span-1 flex flex-col border-0 md:col-span-3">
        <div className="flex flex-col gap-2 border-b border-border p-6">
          <p className="text-label-13 text-muted-foreground">
            Who it&apos;s for
          </p>
          <h2 className="text-heading-32 tracking-tight text-balance lg:text-heading-40">
            The same registry. Three doors in.
          </h2>
        </div>
      </div>
      {PERSONAS.map((persona) => (
        <Link
          key={persona.slug}
          href={persona.href}
          aria-label={`${persona.label}: ${persona.headline}`}
          className="group flex flex-col transition-colors hover:bg-accent/40"
        >
          <p className="p-6 pb-0 text-label-13 text-muted-foreground">
            {persona.label}
          </p>
          <h3 className="!m-0 px-6 pt-2 text-heading-20 tracking-tight text-foreground">
            {persona.headline}
          </h3>
          <p className="flex-1 px-6 pt-2 text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
            {persona.outcome}
          </p>
          <p className="inline-flex items-center gap-1 px-6 pt-2 pb-6 text-label-13 text-foreground">
            Learn more
            <ArrowRight className="size-3" aria-hidden />
          </p>
        </Link>
      ))}
    </Section>
  )
}
