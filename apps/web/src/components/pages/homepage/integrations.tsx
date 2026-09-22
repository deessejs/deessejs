import { Section } from "@/app/(marketing)/_components/section"
import { IntegrationColumns } from "@/app/(marketing)/_components/integration-columns"
import { INTEGRATIONS } from "@/lib/marketing/home-data"

/** Integrations — 3-col logo wall (Frameworks / Providers / AI agents). */
export function Integrations() {
  return (
    <Section>
      <div className="flex flex-col gap-8 p-6 lg:p-8">
        <div className="flex flex-col gap-2">
          <p className="text-label-13 text-muted-foreground">
            Plays well with
          </p>
          <h2 className="text-heading-24 lg:text-heading-32 tracking-tight text-balance">
            Bring your own providers.
          </h2>
          <p className="text-copy-14 text-muted-foreground leading-6 max-w-2xl [&:not(:first-child)]:mt-0">
            The contracts consume whichever providers you trust. Swap
            Stripe for Lemon Squeezy, Upstash for Trigger.dev, Sentry for
            Better Stack. The interface does not change.
          </p>
        </div>
        <IntegrationColumns integrations={INTEGRATIONS} />
      </div>
    </Section>
  )
}
