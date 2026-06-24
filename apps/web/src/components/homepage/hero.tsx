import { ArrowRight, BookOpen } from "lucide-react"

import { Badge } from "@workspace/ui/components/ui/badge"
import { Button } from "@workspace/ui/components/ui/button"

// Hero uses the editorial frame: max-w-7xl + border-x + border-foreground/15.
// Section padding follows the 8/16/32 three-step vertical rhythm.
const bodyContainerClass =
  "mx-auto w-full max-w-7xl border-x border-foreground/15 px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-16 md:py-24 lg:py-32"

/**
 * HomeHero — first-fold section of the marketing site.
 *
 * Centered column, badge → h1 → subhead → 2 CTAs → microcopy.
 * Takes the full first fold (`min-h-[calc(100vh-3.5rem)]` to account
 * for the 56px sticky header).
 *
 * Dummy copy for the M1 vertical slice. Replace with the real
 * positioning headline and value proposition when the marketing
 * content is finalized.
 */
export function HomeHero() {
  return (
    <section
      className={`${sectionPadding} flex min-h-[calc(100vh-3.5rem)] items-center justify-center`}
    >
      <div
        className={`${bodyContainerClass} flex max-w-3xl flex-col items-center text-center`}
      >
        <Badge variant="secondary" className="mb-6">
          Now in public beta
        </Badge>
        <h1 className="text-balance text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
          Headline goes here
        </h1>
        <p className="mt-6 max-w-2xl text-pretty text-lg text-muted-foreground sm:text-xl">
          One-sentence value proposition that explains what the product does
          and why it matters to the buyer.
        </p>
        <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
          <Button size="lg">
            Get started
            <ArrowRight />
          </Button>
          <Button size="lg" variant="outline">
            <BookOpen />
            Read the docs
          </Button>
        </div>
        <p className="mt-6 text-sm text-muted-foreground">
          Free during beta · No credit card required
        </p>
      </div>
    </section>
  )
}
