import type { Metadata } from "next"
import Link from "next/link"
import { Check, ShieldCheck, Wrench } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

import { EnterpriseForm } from "./enterprise-form"
import { EnterpriseFaq } from "./_components/enterprise-faq"
import { ProcessTimeline } from "./_components/process-timeline"
import { TRUST_BADGES } from "./_components/trust-badges"
import { MarketingPage } from "../../_components/marketing-page"
import { ENTERPRISE_FAQ } from "./_lib/enterprise-faq"
import { PERSONA_ROUTES, type PersonaRoute } from "./_lib/persona-routes"
import { PROOF_POINTS } from "./_lib/proof-points"
import { jsonLdScript } from "@/lib/json-ld"

export const metadata: Metadata = {
  title: "Enterprise",
  description:
    "Custom Pro engagements for larger teams. Multi-template bundles, dedicated support, procurement-ready invoicing.",
  robots: { index: false, follow: false },
}

const PERSONA_ICONS = {
  "shield-check": ShieldCheck,
  wrench: Wrench,
} as const

/**
 * Enterprise page at /enterprise.
 *
 * Renders as a Server Component with the same Recipe A shared-border
 * grid pattern used on the marketing homepage. Sections, top to bottom:
 *
 *   1. Hero (single column, centered, eyebrow + h1 + lead + CTAs)
 *   2. Trust and compliance (3 cells, 3-col grid — only verifiable claims)
 *   3. Persona routing — engineering leadership / procurement & security
 *   4. Proof points (2x2 grid)
 *   5. Process timeline (3 steps)
 *   6. Inquiry form (sticky on md+, with intro copy and micro-disclosure)
 *   7. FAQ (Accordion, JSON-LD FAQPage derived from same array)
 *   8. Related links (Pricing / OSS / Help)
 *   9. Final CTA (Install CLI / Talk to delivery)
 *
 * JSON-LD ContactPage + FAQPage live as the first children of the
 * article, before the visible UI, so the structured data is crawler-
 * only and cannot drift from the visible Accordion copy.
 *
 * The mailto submit handler lives in `enterprise-form.tsx` and is
 * the only Client Component in this tree.
 */
export default function EnterprisePage() {
  return (
    <MarketingPage>
      {/* ContactPage + FAQPage JSON-LD. The FAQPage mainEntity is
          derived from ENTERPRISE_FAQ so the schema and the visible
          Accordion never drift apart. */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: jsonLdScript({
            "@context": "https://schema.org",
            "@type": "ContactPage",
            name: "DeesseJS Enterprise",
            description:
              "Custom Pro engagements for larger teams. Multi-template bundles, dedicated support, procurement-ready invoicing.",
            url: "/enterprise",
            mainEntity: {
              "@type": "FAQPage",
              mainEntity: ENTERPRISE_FAQ.map((item) => ({
                "@type": "Question",
                name: item.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: item.answer,
                },
              })),
            },
          }),
        }}
      />

      {/* Recipe A: single shared-border wrapper, sections separated
          by `border-b border-border`. Internal grids use
          `divide-y divide-border md:divide-y-0 md:divide-x` so cells
          share borders. Mirrors the homepage contract (see
          `apps/web/src/app/(marketing)/page.tsx`). */}
      {/* 1. Hero — single column, centered, eyebrow + h1 + lead
            + CTAs. No image, no split layout — the homepage pattern
            for the highest-emphasis section on the page. */}
        <div className="flex flex-col items-center gap-6 border-b border-border p-6 text-center lg:p-16">
          <div className="flex max-w-3xl flex-col items-center gap-6">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Enterprise
            </p>
            <h1 className="text-heading-40 sm:text-heading-48 lg:text-heading-56 font-medium tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Get your team to production in weeks, not quarters.
            </h1>
            <p className="text-muted-foreground text-copy-18 sm:text-copy-20 leading-7 max-w-2xl text-balance [&:not(:first-child)]:mt-0">
              Multi-template bundles, custom scaffolding on top of a Pro
              template, weekly syncs with a senior engineer, and procurement-
              ready invoicing. Tell us what you are building and we will
              reply within two business days.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
              <Button asChild size="lg">
                <Link href="#inquiry">Talk to us about Enterprise</Link>
              </Button>
              <Button asChild size="lg" variant="outline">
                <Link href="/pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        </div>

        {/* 2. Trust and compliance — 3 cells, 3-col grid on md+.
            Each cell renders a verifiable claim only — no fabricated
            SOC 2 / ISO 27001 badges. The eyebrow + heading pair rides
            above the grid inside a full-width band, matching the
            homepage section header recipe. */}
        <div className="border-b border-border">
          <div className="flex flex-col gap-6 p-6 lg:p-10">
            <header className="flex flex-col gap-2">
              <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
                Trust and compliance
              </p>
              <h2 className="text-heading-24 lg:text-heading-32 tracking-tight text-balance [&:not(:first-child)]:mt-0">
                Procurement paperwork returned in five business days.
              </h2>
            </header>
            <ul className="grid grid-cols-1 md:grid-cols-3 gap-0 border border-border md:divide-y divide-border">
              {TRUST_BADGES.map((badge, index) => (
                <li
                  key={badge.label}
                  className={cn(
                    "flex flex-col gap-1 p-5 lg:p-6 transition-colors hover:bg-accent/40",
                    // Drop the right border on every cell except the
                    // last one so adjacent cells share borders.
                    index < TRUST_BADGES.length - 1 && "md:border-r md:border-border",
                  )}
                >
                  <span className="text-heading-16 font-semibold tracking-tight text-foreground">
                    {badge.label}
                  </span>
                  <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                    {badge.detail}{" "}
                    <Link
                      href={badge.href}
                      className="text-foreground underline-offset-4 hover:underline"
                    >
                      Request
                    </Link>
                  </p>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* 3. Persona routing — engineering leadership first, then
            procurement and security. */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {PERSONA_ROUTES.map((persona) => (
            <PersonaCell key={persona.label} persona={persona} />
          ))}
        </div>

        {/* 4. Proof points (2x2 grid). */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          {PROOF_POINTS.map((point) => (
            <div
              key={point.title}
              className="flex gap-3 p-6 lg:p-10 transition-colors hover:bg-accent/40"
            >
              <Check
                className="mt-1 size-4 shrink-0 text-emerald-500"
                aria-hidden
              />
              <div className="flex flex-col gap-1">
                <h3 className="text-heading-16 font-semibold tracking-tight text-foreground [&:not(:first-child)]:mt-0">
                  {point.title}
                </h3>
                <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                  {point.body}
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* 5. Process timeline. */}
        <div className="border-b border-border">
          <ProcessTimeline />
        </div>

        {/* 6. Inquiry form. Left column carries the intro copy and
            a micro-disclosure of what happens after submit; right
            column hosts the form and sticks on md+. */}
        <div
          id="inquiry"
          className="grid grid-cols-1 md:grid-cols-[minmax(0,1fr)_minmax(0,520px)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border"
        >
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Inquiry
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Tell us what you are building.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
              Four fields, two minutes. We reply with a scope within two
              business days.
            </p>
            <ul className="flex flex-col gap-2 text-copy-13 text-muted-foreground">
              <li className="flex gap-2">
                <span aria-hidden className="select-none">•</span>
                <span>
                  Your data stays with you. We do not share inquiries.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="select-none">•</span>
                <span>
                  Size, budget, timeline? We ask in the follow-up, not the
                  form.
                </span>
              </li>
              <li className="flex gap-2">
                <span aria-hidden className="select-none">•</span>
                <span>
                  No account, no signup. Submitting opens your mail client
                  with the inquiry pre-filled.
                </span>
              </li>
            </ul>
          </div>
          <div className="p-6 lg:p-10 md:sticky md:top-20 md:self-start">
            <EnterpriseForm />
          </div>
        </div>

        {/* 7. FAQ. Two-column layout: eyebrow + heading on the left,
            Accordion on the right. */}
        <div className="grid grid-cols-1 md:grid-cols-[14rem_minmax(0,1fr)] divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <div className="flex flex-col gap-2 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              FAQ
            </p>
            <h2 className="text-heading-24 tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Common questions.
            </h2>
          </div>
          <div className="p-6 lg:p-10">
            <EnterpriseFaq />
          </div>
        </div>

        {/* 8. Related links. */}
        <div className="grid grid-cols-1 md:grid-cols-3 divide-y divide-border md:divide-y-0 md:divide-x divide-border border-b border-border">
          <RelatedCell
            eyebrow="Pricing"
            title="Skip 124+ hours of plumbing."
            body="The $299 lifetime Pro package. One payment, every Pro template, every future release."
            href="/pricing"
            cta="See pricing"
          />
          <RelatedCell
            eyebrow="Open Source"
            title="Pro for OSS"
            body="Free Pro license for maintainers of public open source projects."
            href="/oss"
            cta="Read the OSS terms"
          />
          <RelatedCell
            eyebrow="Help"
            title="Help center"
            body="Documentation, troubleshooting, and answers to common questions about templates and the CLI."
            href="/help"
            cta="Open help center"
          />
        </div>

        {/* 9. Final CTA — mirrors the homepage last section. */}
        <div className="grid grid-cols-1 md:grid-cols-2 divide-y divide-border md:divide-y-0 md:divide-x divide-border">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Ready to ship?
            </p>
            <h2 className="text-heading-32 lg:text-heading-40 tracking-tight text-balance [&:not(:first-child)]:mt-0">
              Use the templates. Or ship with us.
            </h2>
            <p className="text-copy-16 text-muted-foreground leading-7 max-w-xl [&:not(:first-child)]:mt-0">
              Install the CLI to scaffold a project in under five minutes.
              Or talk to our delivery team. Same templates, same contracts,
              same guarantees.
            </p>
          </div>
          <div className="flex flex-col items-stretch justify-center gap-3 p-6 lg:p-10">
            <Button asChild size="lg">
              <Link href="/knowledge-base/guides/install-deessejs-cli">
                Install the CLI
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link href="/delivery">Talk to delivery</Link>
            </Button>
            <Button asChild size="lg" variant="ghost">
              <Link href="/templates">Browse the registry</Link>
            </Button>
          </div>
        </div>
    </MarketingPage>
  )
}

function PersonaCell({ persona }: { persona: PersonaRoute }) {
  const Icon = PERSONA_ICONS[persona.icon]
  return (
    <div className="flex flex-col gap-4 p-6 lg:p-10">
      <header className="flex items-center gap-2 text-label-13 uppercase tracking-wider text-muted-foreground">
        <Icon className="size-3.5" aria-hidden />
        {persona.label}
      </header>
      <h3 className="text-heading-24 tracking-tight text-foreground text-balance [&:not(:first-child)]:mt-0">
        {persona.title}
      </h3>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {persona.body}
      </p>
      <div className="pt-1">
        <Link
          href={persona.href}
          className="inline-flex items-center gap-1 text-label-13 text-foreground underline-offset-4 hover:underline"
        >
          {persona.ctaLabel}
          <span aria-hidden>→</span>
        </Link>
      </div>
    </div>
  )
}

function RelatedCell({
  eyebrow,
  title,
  body,
  href,
  cta,
}: {
  eyebrow: string
  title: string
  body: string
  href: string
  cta: string
}) {
  const isExternal = href.startsWith("mailto:") || href.startsWith("http")
  return (
    <div className="flex flex-col gap-3 p-6 lg:p-10 transition-colors hover:bg-accent/40">
      <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
        {eyebrow}
      </p>
      <h3 className="text-heading-20 tracking-tight text-foreground [&:not(:first-child)]:mt-0">
        {title}
      </h3>
      <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
        {body}
      </p>
      <Link
        href={href}
        className="inline-flex items-center gap-1 text-label-13 text-foreground underline-offset-4 hover:underline"
        {...(isExternal
          ? { target: "_blank", rel: "noopener noreferrer" }
          : {})}
      >
        {cta}
        <span aria-hidden>→</span>
      </Link>
    </div>
  )
}
