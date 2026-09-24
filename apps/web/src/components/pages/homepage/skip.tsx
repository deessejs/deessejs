import Link from "next/link"
import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/button"

import { Section } from "@/app/(marketing)/_components/section"
import { SKIP_ITEMS, SKIP_TOTAL_HOURS } from "@/lib/marketing/home-data"

/** What you skip — 2-col: copy + CTA left, hour-counted list right. */
export function Skip() {
  return (
    <Section className="grid grid-cols-1 lg:grid-cols-2 divide-y divide-border lg:divide-y-0 lg:divide-x divide-border">
      <div className="flex flex-col gap-4 p-6 lg:p-8">
        <p className="text-label-13 text-muted-foreground">What you skip</p>
        <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance">
          {SKIP_TOTAL_HOURS} hours of plumbing you don&apos;t have to repeat.
        </h2>
        <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
          Every template ships with the integrations, the configurations,
          and the trade-offs already made. You start at the next problem,
          not at the same one.
        </p>
        <Button variant="outline" asChild className="self-start">
          <Link href="/blog/time-to-production">
            See the math
            <ArrowRight className="size-3.5" aria-hidden />
          </Link>
        </Button>
      </div>
      <ul className="flex flex-col divide-y divide-border">
        {SKIP_ITEMS.map((item) => (
          <li
            key={item.label}
            className="flex items-baseline gap-4 px-6 py-3 lg:px-8"
          >
            <span className="text-copy-13-mono text-foreground shrink-0 w-20">
              {item.hours}
            </span>
            <span className="text-copy-14 text-muted-foreground leading-6">
              {item.label}
            </span>
          </li>
        ))}
      </ul>
    </Section>
  )
}
