import type { Metadata } from "next"
import { APP_CONFIG } from "@/lib/app-config"
import { FlickeringGrid } from "@/components/marketing/flickering-grid"
import { Section } from "@/components/marketing/section"
import { SectionHeader } from "@/components/marketing/section-header"
import { FinalCta } from "@/components/pages/_shared/final-cta"

import { APPLY_STEPS, ELIGIBILITY, WHAT_YOU_GET } from "@/components/marketing/oss/oss-content"
import { OssApplicationForm } from "@/components/marketing/oss/oss-application-form"

export const metadata: Metadata = {
  title: "Open Source Program",
  description:
    "DeesseJS Pro for open source maintainers. The license binds to the project, not the individual.",
  alternates: { canonical: "/oss" },
  openGraph: {
    title: "Open Source Program",
    description:
      "DeesseJS Pro for open source maintainers. The license binds to the project, not the individual.",
    siteName: APP_CONFIG.name,
    locale: "en_US",
    url: "/oss",
  },
  twitter: {
    card: "summary_large_image",
    title: "Open Source Program",
    description:
      "DeesseJS Pro for open source maintainers. The license binds to the project, not the individual.",
  },
}

/**
 * /oss. Marketing route at `/oss`. The Open Source Program grants
 * a project-scoped DeesseJS Pro license, MIT, free of charge, bound
 * to the public repo rather than the individual maintainer.
 *
 * Composition (top to bottom):
 *   1. Hero                : `FlickeringGrid` + centered column,
 *                            same recipe as `/blog` and
 *                            `/blog/tag/[tag]`.
 *   2. What you get        : 4-cell grid (`WHAT_YOU_GET`) inside a
 *                            `Section`.
 *   4. Eligibility         : 4-cell grid (`ELIGIBILITY`) inside a
 *                            `Section`.
 *   5. How to apply        : 3-cell grid (`APPLY_STEPS`) inside a
 *                            `Section`.
 *   6. Apply now           : split layout, editorial copy on the left,
 *                            `<OssApplicationForm />` on the right.
 *                            Form is visual-only for now (submit
 *                            disabled); the actual submit pipeline
 *                            will be wired in a follow-up.
 *   7. Final CTA           : `FinalCta` from
 *                            `@/components/pages/_shared/final-cta`,
 *                            `noBorderB` so `GlobalLayout` closes
 *                            cleanly. Re-pitches email as the
 *                            escape-hatch for visitors who would
 *                            rather write than fill the form.
 */
export default function OssPage() {
  return (
    <>
      {/* 1. Hero */}
      <Section>
        <header className="relative overflow-hidden">
          <FlickeringGrid
            className="absolute inset-0 z-0 opacity-60"
            squareSize={3}
            gridGap={5}
            flickerChance={0.15}
            maxOpacity={0.18}
            color="rgb(120, 120, 120)"
          />
          <div className="relative z-10 flex flex-col items-center gap-3 px-6 py-16 text-center sm:py-20 lg:py-24">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Open source
            </p>
            <h1 className="text-heading-40 font-medium tracking-tight text-balance sm:text-heading-48 lg:text-heading-56">
              DeesseJS Pro for the project you maintain.
            </h1>
            <p className="max-w-2xl text-copy-18 leading-7 text-muted-foreground text-balance [&:not(:first-child)]:mt-0">
              Public open source projects can get a DeesseJS Pro license
              under the same terms as verified students. The license binds
              to the project, not the maintainer. A maintainer change does
              not invalidate the license, and the license does not
              transfer to non-contributors.
            </p>
          </div>
        </header>
      </Section>

      {/* 2. What you get */}
      <Section>
        <SectionHeader
          eyebrow="What you get"
          title="Everything Pro ships, scoped to the project."
          subtitle="Lifetime access to the full Pro catalog, source code delivered for every template, and cloud access for each one. MIT-licensed, free of charge."
        />
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {WHAT_YOU_GET.map((item) => (
            <div
              key={item.title}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {item.title}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {item.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 3. Eligibility */}
      <Section>
        <SectionHeader
          eyebrow="Eligibility"
          title="Four rules, all four apply."
          subtitle="Public, active, named, and scoped. The license follows the project through maintainer changes; it does not extend to other projects owned by the same person."
        />
        <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 lg:grid-cols-4">
          {ELIGIBILITY.map((rule) => (
            <div
              key={rule.title}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {rule.title}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {rule.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* 4. How to apply */}
      <Section>
        <SectionHeader
          eyebrow="How to apply"
          title="Three steps. Reply within five business days."
          subtitle="Email the repo URL and a one-sentence description. We send back a license file scoped to the project. You commit it next to the codebase so future maintainers see it."
        />
        <ol className="grid grid-cols-1 divide-y divide-border md:grid-cols-3 md:divide-x md:divide-y-0">
          {APPLY_STEPS.map((step, idx) => (
            <li
              key={step.heading}
              className="flex flex-col gap-3 p-6 lg:p-8"
            >
              <span className="font-mono text-copy-13 text-muted-foreground">
                Step {String(idx + 1).padStart(2, "0")}
              </span>
              <h3 className="text-heading-20 font-medium tracking-tight text-foreground">
                {step.heading}
              </h3>
              <p className="text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
                {step.body}
              </p>
            </li>
          ))}
        </ol>
      </Section>

      {/* 5. Apply now — split layout with editorial copy on the left
             and the application form on the right. Form is visual-only
             for now (submit disabled); the actual submission logic will
             be wired in a follow-up. See
             `./_components/oss-application-form.tsx`. */}
      <Section>
        <div className="grid grid-cols-1 divide-y divide-border lg:grid-cols-2 lg:divide-x lg:divide-y-0">
          <div className="flex flex-col gap-4 p-6 lg:p-10">
            <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
              Apply now
            </p>
            <h2 className="text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
              Tell us about the project.
            </h2>
            <p className="max-w-md text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
              Five fields. We reply within five business days with a
              license file scoped to the project.
            </p>
            <ul className="mt-2 flex flex-col gap-2 text-copy-14 text-muted-foreground">
              <li className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-foreground/40"
                />
                The repo must satisfy the four eligibility rules
                (public, active, listed in maintainer file, scoped).
              </li>
              <li className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-foreground/40"
                />
                The license binds to the project. A maintainer change
                does not invalidate it.
              </li>
              <li className="flex gap-2">
                <span
                  aria-hidden
                  className="mt-1 inline-block size-1.5 shrink-0 rounded-full bg-foreground/40"
                />
                No cash, no co-marketing. The offer is the license.
              </li>
            </ul>
          </div>
          <div className="p-6 lg:p-10">
            <OssApplicationForm />
          </div>
        </div>
      </Section>

      {/* 6. Final CTA. `noBorderB` closes the GlobalLayout outline. */}
      <FinalCta
        noBorderB
        eyebrow="Prefer email"
        title="Open source maintainers who would rather write to us."
        body="If the form is too much, the same five fields by email to support@deessejs.com. We reply within five business days."
        actions={[
          {
            label: "Email support@deessejs.com",
            href: "mailto:support@deessejs.com?subject=OSS%20license%20application",
          },
          {
            label: "Browse templates",
            href: "/templates",
            variant: "outline",
            withArrow: true,
          },
        ]}
      />
    </>
  )
}