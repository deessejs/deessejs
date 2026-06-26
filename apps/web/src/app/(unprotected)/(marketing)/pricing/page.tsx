import type { Metadata } from "next"
import Link from "next/link"
import { ArrowRight, BookOpen, Check } from "lucide-react"

import { Button } from "@workspace/ui/components/ui/button"
import { Badge } from "@workspace/ui/components/ui/badge"
import {
  Card,
  CardDescription,
  CardTitle,
} from "@workspace/ui/components/ui/card"

import { HomeFooter } from "@/components/footers/home-footer"

import { ComparisonBlock } from "@/components/pricing/comparison-block"
import { FeatureMatrix } from "@/components/pricing/feature-matrix"
import { GuaranteeStrip } from "@/components/pricing/guarantee-strip"
import { PricingFaq } from "@/components/pricing/pricing-faq"
import { ProofRow } from "@/components/pricing/proof-row"
import { TierGrid } from "@/components/pricing/tier-grid"

import { comparisonBlocks, guarantee, pricingFaqs, proofItems, tiers } from "@/lib/pricing/data"
import { featureCategories } from "@/lib/pricing/matrix"

export const metadata: Metadata = {
  title: "Pricing — DeesseJS",
  description:
    "Pick your plan. Three tiers, lifetime updates. One-time price, no subscriptions.",
  alternates: {
    canonical: "/pricing",
  },
  openGraph: {
    title: "Pricing — DeesseJS",
    description:
      "Pick your plan. Three tiers, lifetime updates. One-time price, no subscriptions.",
    url: "/pricing",
  },
}

const bodyContainerClass = "mx-auto w-full max-w-6xl px-4 sm:px-6 lg:px-8"
const sectionPadding = "py-24 sm:py-32"

/**
 * /pricing — dedicated pricing route.
 *
 * Inherits the HomeHeader + bordered main shell from (unprotected)/layout.tsx.
 * Renders <HomeFooter /> itself (the layout does not include it).
 *
 * Section order follows the Raze 4-layer content model:
 *   1. TierGrid            (Layer 1: Package — leads the page)
 *   2. FeatureMatrix       (Layer 2: Differences — the actual comparison)
 *   3. ComparisonBlock     (Layer 3: Exceptions / vs competitors)
 *   4. ProofRow            (Layer 4: what you ship on day 1)
 *   5. GuaranteeStrip      (reassurance)
 *   6. PricingFaq          (pricing-specific Q&A)
 *   7. Final CTA           (twin buttons, same pattern as home)
 */
export default function PricingPage() {
  return (
    <div className="flex min-h-screen flex-col selection:bg-foreground selection:text-background">
      <main className="flex-1 border-x border-border/40 mx-auto w-full max-w-[1400px]">
        {/* 1. Tier grid */}
        <section
          id="tiers"
          className={`border-b border-border/40 ${sectionPadding}`}
        >
          <div className={bodyContainerClass}>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h1 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                Pick your plan.
              </h1>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                Three tiers, one-time price, lifetime updates. Every tier
                ships with the full wired runtime — higher tiers unlock
                team-scale features and priority support.
              </p>
            </div>
            <TierGrid tiers={tiers} />

            {/* Free template — DeesseJS Lite (open-source subset) */}
            <Card className="mx-auto mt-10 w-full max-w-4xl rounded-lg border bg-background p-8 shadow-sm">
              <div className="flex flex-col items-center gap-6 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex-1 text-center sm:text-left">
                  <div className="flex items-center justify-center gap-2 sm:justify-start">
                    <CardTitle className="text-2xl font-semibold">
                      DeesseJS Lite
                    </CardTitle>
                    <Badge
                      variant="secondary"
                      className="rounded-full px-2.5 py-0.5 text-xs font-medium"
                    >
                      Free
                    </Badge>
                  </div>
                  <CardDescription className="mt-2 text-base text-muted-foreground">
                    Open-source subset of the template. Auth, billing, agent
                    primitives — and that&apos;s it.
                  </CardDescription>
                  <ul className="mt-4 flex flex-wrap items-center justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground sm:justify-start">
                    <li className="flex items-center gap-1.5">
                      <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                      MIT licensed
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                      Auth + billing wired
                    </li>
                    <li className="flex items-center gap-1.5">
                      <Check className="size-4 shrink-0 text-foreground" aria-hidden />
                      AGENTS.md included
                    </li>
                  </ul>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-1.5 sm:items-end">
                  <Button
                    variant="default"
                    className="h-11 w-full rounded-md font-medium sm:w-auto"
                    nativeButton={false}
                    render={<a href="https://github.com/nesalia-inc/deessejs-lite" />}
                  >
                    Get DeesseJS Lite
                    <ArrowRight className="size-4" />
                  </Button>
                  <span className="text-xs text-muted-foreground">
                    Open source · Free forever
                  </span>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* 2. Feature matrix */}
        <section
          id="compare"
          className={`border-b border-border/40 ${sectionPadding}`}
        >
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-5xl">
                Compare every feature.
              </h2>
              <p className="mt-4 text-pretty text-lg text-muted-foreground">
                The full breakdown across all 3 tiers. Hover any row label
                for details.
              </p>
            </div>
            <FeatureMatrix categories={featureCategories} tiers={tiers} />
          </div>
        </section>

        {/* 3. Comparison block */}
        <section className={`border-b border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                How we compare.
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                What you get with DeesseJS that other SaaS templates don&apos;t ship.
              </p>
            </div>
            <ComparisonBlock blocks={comparisonBlocks} />
          </div>
        </section>

        {/* 4. Proof row */}
        <section className={`border-b border-border/40 bg-muted/10 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                What you ship on day 1.
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Every surface is wired, tested, and ready to deploy.
              </p>
            </div>
            <ProofRow items={proofItems} />
          </div>
        </section>

        {/* 5. Guarantee */}
        <section className={`border-b border-border/40 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <GuaranteeStrip guarantee={guarantee} />
          </div>
        </section>

        {/* 6. FAQ */}
        <section className={`border-b border-border/40 bg-muted/10 ${sectionPadding}`}>
          <div className={bodyContainerClass}>
            <div className="mx-auto mb-12 max-w-2xl text-center">
              <h2 className="text-balance text-3xl font-bold tracking-tighter text-foreground sm:text-4xl">
                Pricing questions.
              </h2>
              <p className="mt-4 text-pretty text-base text-muted-foreground">
                Money-back guarantee, free tier, and how the founder pricing works.
              </p>
            </div>
            <PricingFaq faqs={pricingFaqs} />
          </div>
        </section>

        {/* 7. Final CTA */}
        <section
          className={`relative overflow-hidden ${sectionPadding}`}
        >
          <div className="absolute left-1/2 top-1/2 -z-10 h-[400px] w-[800px] -translate-x-1/2 -translate-y-1/2 opacity-20 blur-[100px] bg-foreground/20 rounded-full pointer-events-none" />
          <div className={`${bodyContainerClass} flex flex-col items-center text-center`}>
            <h2 className="text-balance text-4xl font-bold tracking-tighter text-foreground sm:text-6xl">
              Ready to ship your agents?
            </h2>
            <p className="mt-6 max-w-2xl text-pretty text-lg font-medium text-muted-foreground sm:text-xl">
              Get started in minutes. No credit card required.
            </p>
            <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
              <Button
                size="lg"
                className="h-12 gap-2 rounded-full px-8 text-base font-semibold shadow-md transition-transform hover:scale-105"
                nativeButton={false}
                render={<Link href="/signup" />}
              >
                Get DeesseJS
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="h-12 gap-2 rounded-full px-8 text-base font-medium shadow-sm backdrop-blur-md"
                nativeButton={false}
                render={<Link href="/docs" />}
              >
                <BookOpen className="h-4 w-4" />
                Read the docs
              </Button>
            </div>
          </div>
        </section>
      </main>

      <HomeFooter />
    </div>
  )
}