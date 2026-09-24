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
      eyebrow="Ready to ship?"
      title="Start with a template. Keep the contracts."
      body="Install the CLI, pick a starter, and your agent gets every contract it needs to navigate the rest of the project."
      actions={[
        {
          label: "Start now",
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
