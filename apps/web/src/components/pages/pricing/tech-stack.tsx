import { TechStackGrid } from "@/app/(marketing)/_components/tech-stack-grid"
import { TECH_STACK } from "@/lib/marketing/home-data"

/**
 * Tech stack shown in the "Built with" strip. Same set as the home
 * page — Next.js, Better Auth, Drizzle, Stripe, Postgres, Cloudflare,
 * Resend, OpenAI — every provider and runtime wired into the Pro
 * templates out of the box.
 *
 * Re-exports the canonical `TECH_STACK` from `home-data.ts` so a
 * future tweak to the logo wall propagates to every surface at once.
 * The original TODO ("deduplicate with home-data.ts") is now resolved
 * by this import.
 */
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
