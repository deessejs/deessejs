import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Section } from "@/app/(marketing)/_components/section"
import { PERSONAS } from "@/lib/marketing/home-data"

/** Who it's for — 4-cell persona grid. */
export function ForWho() {
  return (
    <Section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
      <div className="flex flex-col p-6 col-span-1 md:col-span-2 lg:col-span-4 p-0 border-0">
        <div className="flex flex-col gap-2 p-6 border-b border-border">
          <p className="text-label-13 text-muted-foreground">Who it&apos;s for</p>
          <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
            The same registry. Four doors in.
          </h2>
        </div>
      </div>
      {PERSONAS.map((persona) => (
        <Link
          key={persona.slug}
          href={`/solutions/${persona.slug}`}
          aria-label={`${persona.label}: ${persona.headline}`}
          className="group flex flex-col transition-colors hover:bg-accent/40"
        >
          <p className="text-label-13 text-muted-foreground p-6 pb-0">
            {persona.label}
          </p>
          <h3 className="text-heading-20 tracking-tight text-foreground !m-0 px-6 pt-2">
            {persona.headline}
          </h3>
          <p className="text-copy-14 text-muted-foreground leading-6 px-6 pt-2 flex-1 [&:not(:first-child)]:mt-0">
            {persona.outcome}
          </p>
          <p className="text-label-13 text-foreground inline-flex items-center gap-1 px-6 pt-2 pb-6">
            Learn more
            <ArrowRight className="size-3" aria-hidden />
          </p>
        </Link>
      ))}
    </Section>
  )
}
