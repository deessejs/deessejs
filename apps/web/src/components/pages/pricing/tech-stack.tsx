import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"

/**
 * Tech stack shown in the "Built with" strip. Same set as the home
 * page — Next.js, Better Auth, Drizzle, Stripe, Postgres, Cloudflare,
 * Resend, OpenAI — every provider and runtime wired into the Pro
 * templates out of the box.
 *
 * TODO: deduplicate with `home-data.ts` `TECH_STACK` (see commit history
 * for the divergence). Two sources of truth for the same logo wall —
 * one for marketing, one for pricing. Should live in
 * `lib/marketing/stack.ts` if a third consumer shows up.
 */
const TECH_STACK: ReadonlyArray<{ name: string; logo: string }> = [
  { name: "Next.js", logo: "vercel" },
  { name: "Better Auth", logo: "betterauth" },
  { name: "Drizzle", logo: "drizzle" },
  { name: "Stripe", logo: "stripe" },
  { name: "Postgres", logo: "postgresql" },
  { name: "Cloudflare", logo: "cloudflare" },
  { name: "Resend", logo: "resend" },
  { name: "OpenAI", logo: "openai" },
]

export function TechStack() {
  return (
    <div className="grid grid-cols-1 divide-y divide-border border-b border-border">
      <div className="px-8 py-6">
        <p className="text-heading-24 tracking-tighter text-balance [&:not(:first-child)]:mt-0">
          Built with the stack senior engineers ship on.
        </p>
      </div>
      <TechStackGrid techs={TECH_STACK} />
    </div>
  )
}
