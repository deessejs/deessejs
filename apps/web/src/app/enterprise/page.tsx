import type { Metadata } from "next"
import Link from "next/link"
import { Check } from "lucide-react"

import { EnterpriseForm } from "./enterprise-form"

export const metadata: Metadata = {
  title: "Enterprise",
  description:
    "Custom Pro engagements for larger teams. Multi-template bundles, dedicated support, and procurement-ready invoicing.",
  robots: { index: false, follow: false },
}

const PROOF_POINTS = [
  {
    title: "Multi-template bundles",
    body: "Pull several Pro templates together into a single engagement so the team starts with a coherent stack.",
  },
  {
    title: "Custom scaffolding on top of Pro",
    body: "We extend any Pro template with the pages, fields, and workflows specific to your business.",
  },
  {
    title: "Dedicated support",
    body: "Named engineer for the duration of the engagement. Issues, reviews, and code questions route to a person, not a queue.",
  },
  {
    title: "Procurement-friendly invoicing",
    body: "POs, NET-30, vendor forms, security questionnaires, NDAs. The paperwork does not slow the work down.",
  },
] as const

/**
 * Enterprise page. Two-column layout: hero + proof points on the
 * left, inquiry form on the right (stacks vertically below md).
 *
 * The form (client component, see ./enterprise-form) submits via
 * mailto for V1; the body of this page stays a Server Component so
 * the `metadata` export is valid.
 */
export default function EnterprisePage() {
  return (
    <article className="mx-auto flex max-w-6xl flex-col gap-12 px-4 py-16 sm:px-6 lg:py-24">
      <div className="grid grid-cols-1 gap-12 md:grid-cols-2 md:gap-16">
        <div className="flex flex-col gap-8">
          <header className="flex flex-col gap-4">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Enterprise
            </p>
            <h1 className="text-heading-56 tracking-tight">
              Custom Pro engagements, for teams that need more.
            </h1>
            <p className="text-muted-foreground text-copy-20 leading-7 max-w-xl [&:not(:first-child)]:mt-0">
              Multi-template bundles, custom scaffolding on top of a Pro
              template, dedicated support, and procurement-ready invoicing.
              Tell us what you need and we will reply within two business
              days.
            </p>
          </header>

          <ul className="flex flex-col gap-5">
            {PROOF_POINTS.map((point) => (
              <li key={point.title} className="flex gap-3">
                <Check
                  className="mt-1 size-4 shrink-0 text-foreground"
                  aria-hidden="true"
                />
                <div className="flex flex-col gap-1">
                  <span className="text-heading-16 font-semibold tracking-tight text-foreground">
                    {point.title}
                  </span>
                  <p className="text-copy-14 text-muted-foreground leading-7 [&:not(:first-child)]:mt-0">
                    {point.body}
                  </p>
                </div>
              </li>
            ))}
          </ul>
        </div>

        <div className="md:sticky md:top-20 md:self-start">
          <EnterpriseForm />

          <p className="text-copy-14 text-muted-foreground mt-6 [&:not(:first-child)]:mt-6">
            Looking for the standard Pro package instead?{" "}
            <Link
              href="/pricing"
              className="underline underline-offset-4 hover:text-foreground"
            >
              See pricing
            </Link>
            .
          </p>
        </div>
      </div>
    </article>
  )
}
