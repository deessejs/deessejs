import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /enterprise Final CTA.
 *
 * Single CTA pointing to /delivery. The /delivery page sells
 * engineering services to CTOs. Linking to self-service products
 * at the bottom (Install CLI / Browse registry) would undermine
 * the engagement promise.
 *
 * `/delivery` lives at `apps/web/src/app/(marketing)/delivery/` —
 * same Next.js app as /enterprise, no cross-app URL composition
 * needed.
 */
export function FinalCta() {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Ready to ship?"
      title="Have specific architecture requirements?"
      body="A senior engineer joins your channel, we agree on a scope within three business days, and the codebase lands in your repository on a fixed cadence."
      actions={[
        {
          label: "Talk to delivery",
          href: "/delivery",
          withArrow: true,
        },
      ]}
    />
  )
}
