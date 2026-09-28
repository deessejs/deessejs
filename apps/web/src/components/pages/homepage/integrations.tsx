import Link from "next/link"

import { Section } from "@/app/(marketing)/_components/section"
import { cn } from "@workspace/ui/lib/utils"

/**
 * Integrations — v2 (Direction A).
 *
 * The previous version of this section was a 2-column logo wall
 * (Frameworks + Providers) framed as 'Bring your own providers'.
 * The new version is organised around the 6 contracts — every
 * template ships them, every contract accepts multiple providers,
 * and the registry swaps at the interface.
 *
 * Section 2 (TechStack) remains the 'what we ship today' list.
 * This section is the broader, more stable list of 'what the
 * contracts accept'. The two complement each other.
 *
 * Each contract block lists 4-6 hardcoded providers with a link
 * to the use-case page where that contract is most central. No
 * link here is fabricated: every href resolves to a real route
 * in apps/web/src/app/(product)/use-cases/<slug>/page.tsx.
 *
 * Logo slugs match the simple-icons / t3.codes convention and
 * resolve to `/public/logos/<slug>.svg`. SVGs use fill='currentColor'
 * so they render in monochrome via the existing dark:invert + text-foreground
 * inheritance.
 */

type ContractSlug =
  | "auth"
  | "database"
  | "billing"
  | "jobs"
  | "storage"
  | "observability"

type Provider = {
  /** Brand slug that resolves to /public/logos/<slug>.svg. */
  logo: string
  /** Display name shown next to the logo. */
  name: string
}

type Contract = {
  /** Stable id used for anchor links from other surfaces. */
  id: ContractSlug
  /** Eyebrow label inside the contract block. */
  eyebrow: string
  /** Short positioning sentence (1 line, no marketing fluff). */
  lead: string
  /** Href to the use-case page where this contract is most central. */
  href: string
  /** 4-6 providers accepted by this contract in the registry. */
  providers: ReadonlyArray<Provider>
}

const CONTRACTS: ReadonlyArray<Contract> = [
  {
    id: "auth",
    eyebrow: "Auth",
    lead: "Works behind SSO, OAuth, or magic link — any provider that speaks Better Auth or OIDC.",
    href: "/use-cases/saas-apps",
    providers: [
      { logo: "betterauth", name: "Better Auth" },
      { logo: "clerk",      name: "Clerk" },
      { logo: "auth0",      name: "Auth0" },
      { logo: "lucia",      name: "Lucia" },
    ],
  },
  {
    id: "database",
    eyebrow: "Database",
    lead: "Postgres-compatible: any host that speaks the wire protocol and any ORM that speaks Drizzle.",
    href: "/use-cases/saas-apps",
    providers: [
      { logo: "postgresql", name: "Postgres" },
      { logo: "neon",       name: "Neon" },
      { logo: "supabase",   name: "Supabase" },
      { logo: "drizzle",    name: "Drizzle" },
      { logo: "prisma",     name: "Prisma" },
    ],
  },
  {
    id: "billing",
    eyebrow: "Billing",
    lead: "Stripe today; the billing interface accepts any provider that returns a typed subscription event.",
    href: "/use-cases/saas-apps",
    providers: [
      { logo: "stripe",     name: "Stripe" },
      { logo: "polar-sh",   name: "Polar" },
    ],
  },
  {
    id: "jobs",
    eyebrow: "Jobs",
    lead: "Queues, retries, dead-letter. Any provider with a typed job runner plugs into the same contract.",
    href: "/use-cases/api-backends",
    providers: [
      { logo: "triggerdotdev", name: "Trigger.dev" },
      { logo: "upstash",       name: "Upstash" },
      { logo: "inngest",       name: "Inngest" },
    ],
  },
  {
    id: "storage",
    eyebrow: "Storage",
    lead: "Object storage with S3-compatible signed URLs. Drop-in for any provider behind the same shape.",
    href: "/use-cases/mobile-backend",
    providers: [
      { logo: "cloudflare", name: "Cloudflare R2" },
      { logo: "supabase",   name: "Supabase Storage" },
      { logo: "resend",     name: "Resend" },
    ],
  },
  {
    id: "observability",
    eyebrow: "Observability",
    lead: "OpenTelemetry traces, structured logs, metrics. Any backend that ingests OTel signals.",
    href: "/use-cases/api-backends",
    providers: [
      { logo: "nodedotjs",   name: "OpenTelemetry" },
      { logo: "sentry",       name: "Sentry" },
      { logo: "betterstack",  name: "Better Stack" },
    ],
  },
]

export function Integrations() {
  return (
    <Section>
      <div className="flex flex-col gap-4 p-6 lg:p-10 border-b border-border">
        <p className="text-label-13 uppercase tracking-wider text-muted-foreground">
          Plays well with
        </p>
        <h2 className="max-w-3xl text-heading-32 font-medium tracking-tight text-balance lg:text-heading-40">
          Every contract accepts multiple providers.
        </h2>
        <p className="max-w-3xl text-copy-16 leading-7 text-muted-foreground [&:not(:first-child)]:mt-0">
          The 6 contracts every template ships (auth, database, billing,
          jobs, storage, observability) are interface-only. Swap the
          provider behind each one without touching your code.
        </p>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 border-b border-border">
        {CONTRACTS.map((contract, idx) => (
          <div
            key={contract.id}
            id={contract.id}
            className={cn(
              "flex flex-col gap-4 p-6 lg:p-8",
              idx >= 0 && "border-t border-border",
              idx % 2 === 1 && "md:border-l md:border-border",
              idx % 3 !== 0 && "lg:border-l lg:border-border",
              idx < CONTRACTS.length - 2 && "lg:border-b-0",
              idx < CONTRACTS.length - (CONTRACTS.length % 2 || 2) && "md:border-b-0",
            )}
          >
            <Link
              href={contract.href}
              className="group/contract inline-flex w-fit items-center gap-2 self-start"
              aria-label={`${contract.eyebrow} — open the ${contract.href.replace('/use-cases/', '')} use-case page`}
            >
              <span className="text-label-13 uppercase tracking-wider text-foreground transition-colors group-hover/contract:text-foreground/80">
                {contract.eyebrow}
              </span>
            </Link>
            <p className="max-w-md text-copy-14 leading-6 text-muted-foreground [&:not(:first-child)]:mt-0">
              {contract.lead}
            </p>
            <ul className="flex flex-col gap-2.5 pt-2">
              {contract.providers.map((provider) => (
                <li
                  key={`${contract.id}-${provider.logo}`}
                  className="inline-flex items-center gap-3 text-copy-14 text-foreground"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`/logos/${provider.logo}.svg`}
                    alt=""
                    width={20}
                    height={20}
                    className="size-5 shrink-0 dark:invert"
                    aria-hidden
                  />
                  {provider.name}
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>
    </Section>
  )
}
