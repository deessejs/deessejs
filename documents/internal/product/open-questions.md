# DeesseJS — Open Questions

> **The consolidated list of all open questions**, with priority, blockers, and the decision needed. Updated as decisions land. Source of truth for "what's still undecided."

## Priority levels

- **P0:** Blocks the build. Must be answered before M0 ends.
- **P1:** Blocks a specific milestone. Must be answered before that milestone.
- **P2:** Strategic. Can be answered anytime before launch.
- **P3:** Nice to have. Can be deferred to post-launch.

## Build-blocking (P0)

_None currently open._ All P0 questions are answered. The M0 scaffold can start.

## Milestone-blocking (P1)

### Concrete pricing gates (M7: landing page + sales)

- **Question:** Confirm the concrete tier gates from [`pricing.md`](./pricing.md#concrete-tier-gates-proposed--pending-confirmation). Specifically: 1 vs 3 seats for Solo, 3 vs 5 apps for Team, 10 vs unlimited seats for Team.
- **Owner:** Founder / PM
- **Needed by:** M7 start
- **Notes:** Defaults to the proposed values if no objection.

### Updates scope after 1 year (M7: landing page + sales)

- **Question:** Is 50% renewal the right number for Solo/Team buyers after 1 year, or should it be 30% / free / no-renewal (locked to that version forever)?
- **Owner:** Founder / PM
- **Needed by:** M7 start
- **Notes:** Defaults to 50% renewal if no objection.

### Studio's "1 onboarding session" delivery (M7: landing page + sales)

- **Question:** Who delivers the Studio onboarding session — the founder, a contractor, an agency partner? This is an ops question that affects the Studio margin.
- **Owner:** Founder / PM
- **Needed by:** M7 start
- **Notes:** The session is included in the Studio tier. We need to cost it.

### Monorepo structure (M0: scaffold)

- **Question:** pnpm workspaces + Turborepo? Or another monorepo tool (Nx, Rush)?
- **Owner:** Tech lead
- **Needed by:** M0 start
- **Notes:** Recommendation is pnpm + Turborepo. Confirm or pick another.

### CLI language (M5: API + SDK + CLI)

- **Question:** Is the CLI written in TypeScript (Node or Bun), or in Go / Rust for binary size?
- **Owner:** Tech lead
- **Needed by:** M5 start
- **Notes:** Recommendation is Bun (fast startup, easy to ship, modern default). Confirm or pick.

### Stripe + Lemon Squeezy / Polar (M3: billing)

- **Question:** Do we need a payment wrapper (Lemon Squeezy for tax handling, Polar for OSS-friendliness) on top of Stripe, or is direct Stripe checkout enough?
- **Owner:** Founder / PM + Tech lead
- **Needed by:** M3 start
- **Notes:** Recommendation is direct Stripe. Confirm.

## Strategic (P2)

### Refine the differentiator from supastarter

- **Question:** Is *"the only complete one that doesn't force an architecture on you"* sharp enough, or do we need a more specific claim?
- **Owner:** Founder / PM
- **Needed by:** Before landing page copy
- **Notes:** supastarter is competing on the same axis. The sharper we can be, the better.

### Recurring revenue: support / upgrades subscription

- **Question:** Do we test a thin support / upgrades subscription as a separate product line (not gating features)? Or stay 100% one-time?
- **Owner:** Founder / PM
- **Needed by:** 6 months post-launch
- **Notes:** Recommendation is "no subscription for v1, re-evaluate at 6 months." Confirm.

### Free / OSS tier

- **Question:** Ship a public subset of DeesseJS (just the architecture: Next.js + Drizzle + Better Auth + Tailwind + shadcn) as a top-of-funnel? Or stay 100% paid?
- **Owner:** Founder / PM
- **Needed by:** Post-launch decision
- **Notes:** None of the direct competitors do this. Could be a real differentiator or a maintenance burden.

### Multi-currency

- **Question:** USD only, or also EUR / GBP? Stripe Checkout supports multi-currency natively.
- **Owner:** Founder / PM
- **Needed by:** M7 start
- **Notes:** Default to USD-only for v1; add EUR at launch if buyers ask.

### Education / non-profit discount

- **Question:** Common in dev tools. Worth deciding.
- **Owner:** Founder / PM
- **Needed by:** M7 start
- **Notes:** Recommendation is yes — 30% off with .edu email verification. Confirm.

### Repo directory rename

- **Question:** Rename `complete-template/` on disk to `deessejs/`? Or keep the repo name separate from the product name (like Linear → linear, Notion → notion)?
- **Owner:** Tech lead
- **Needed by:** Before first commit
- **Notes:** Recommendation is keep `complete-template/`, use `DeesseJS` everywhere the buyer sees it. Confirm.

## Nice-to-have (P3)

### Demo data on first run

- **Question:** Should the wizard seed sample orgs / users / products so the buyer can explore before customizing?
- **Owner:** Tech lead
- **Needed by:** M4
- **Notes:** Pro: faster "first SaaS" feel. Con: more to delete. Recommendation is yes, with a "skip sample data" option.

### One-click Vercel deploy

- **Question:** Build a one-click Vercel deploy from the wizard, or just point at `vercel deploy` in the docs?
- **Owner:** Tech lead
- **Needed by:** M4
- **Notes:** Recommendation is just docs. One-click is nice but not load-bearing.

### Demo app on the landing page

- **Question:** Build a public demo app (separate from the wizard) that buyers can try before buying?
- **Owner:** Tech lead + PM
- **Needed by:** M7
- **Notes:** Recommendation is yes — one feature done to 100% on the new stack, as proof of "no half-built features."

### More buyer-voice research (targeted)

- **Question:** Run a third deep-research pass on specific questions (Reddit threads in r/nextjs, Show HN comments, founder Twitter threads)?
- **Owner:** Founder / PM
- **Needed by:** Post-launch, for v2 positioning
- **Notes:** The first two passes found thin copy-ready voice. A targeted pass might find more. Not blocking.

## Recently closed (for reference)

- ~~Storage provider~~ → Cloudflare R2 (2026-06-16)
- ~~Hono deployment model~~ → Hono routes inside Next.js (2026-06-16)
- ~~SDK purpose~~ → Auto-generated TS SDK from Hono OpenAPI (2026-06-16)
- ~~In-app notifications delivery model~~ → Upstash Realtime on Upstash Redis (2026-06-16)
- ~~Observability tool~~ → Skipped for v1 (2026-06-16)
- ~~i18n locales for v1~~ → en only (2026-06-16)
- ~~Brand name~~ → DeesseJS (2026-06-16)
- ~~Pricing structure~~ → 3 tiers (Solo $299 / Team $599 / Studio $999) (2026-06-16)
- ~~Tier gate philosophy~~ → Consistent: gates = rights + support + updates (2026-06-16)

## How to use this doc

- **When starting a milestone**, check this doc for P1 questions that block that milestone.
- **When making a strategic decision**, scan the P2 section first — most open strategic questions are listed.
- **When closing a question**, move it to "Recently closed" with the date. Keep the history.
- **When adding a new question**, assign a priority. If you can't decide P0 vs P1, it's probably P1.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack + modular contract
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Research: [`research.md`](./research.md) — research summary
- Onboarding: [`onboarding.md`](./onboarding.md) — wizard + first hour
- Competitive teardowns: [`competitive-teardowns.md`](./competitive-teardowns.md)
- Build roadmap: [`build-roadmap.md`](./build-roadmap.md) — v1 build sequence
