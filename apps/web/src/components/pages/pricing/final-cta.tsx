import { FinalCta as FinalCtaShell } from "../_shared/final-cta"

/**
 * /pricing Final CTA.
 *
 * `signupHref` is resolved server-side by the page route and
 * passed in pre-formatted. Same convention as the site header:
 * the apps/app origin is a server-resolved absolute URL
 * (`https://app.deessejs.com/signup` in prod, Vercel preview URL
 * under previews, `http://localhost:3001/signup` in dev) so the
 * link never needs client-side URL composition.
 */
export function FinalCta({ signupHref }: { signupHref: string }) {
  return (
    <FinalCtaShell
      noBorderB
      eyebrow="Choose your workspace"
      title="Community is free. Pro is ready when you are."
      body="Sign in, choose or create an organization, then continue to its billing settings."
      actions={[
        {
          label: "Get Pro",
          href: signupHref,
          withArrow: true,
        },
        {
          label: "Browse the registry",
          href: "/templates",
          variant: "outline",
        },
      ]}
    />
  )
}
