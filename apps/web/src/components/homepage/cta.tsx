import { ArrowRight } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"

// Plain max-w-7xl container — the parent <main> provides the outer
// border-x frame, so each section's inner div just constrains width.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

/**
 * HomeCta — final call-to-action before the footer.
 *
 * Centered H2 + sub + 2 CTAs (primary "Get started" + outline "Talk
 * to us"). No card wrapper — text and buttons sit directly on the
 * page background for maximum visual weight.
 *
 * Dummy copy. Replace with the real conversion copy when ready.
 */
export function HomeCta() {
  return (
    <section className={sectionPadding}>
      <div
        className={`${bodyContainerClass} flex flex-col items-center text-center`}
      >
        <h2 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Ready to ship your agents?
        </h2>
        <p className="mt-4 max-w-2xl text-pretty text-lg text-muted-foreground">
          Get started in minutes. No credit card required.
        </p>
        <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg">
            Get started
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline">
            Talk to us
          </Button>
        </div>
      </div>
    </section>
  )
}
