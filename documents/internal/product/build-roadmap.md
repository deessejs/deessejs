# DeesseJS — Build Roadmap

> **The v1 build sequence.** What to build first, in what order, with dependencies and milestones. This is the project-management view of the product spec.

## v1 scope (what ships)

Everything in the [README's feature pillars](./README.md#feature-pillars) except:
- RAG / vector DB (deferred)
- Observability & tracing (skipped)
- Evals (skipped)
- Multi-locale (en only)

The buyer gets the full operational surface + AI primitives (without observability) + the user-facing CLI + the auto-generated TS SDK.

## Build order (the critical path)

This sequence is built around the **modular contract** — each feature module is self-contained, so we can build them in any order. The order below minimizes "blocked by" states.

### M0: Scaffold (week 1)

The monorepo structure, the build system, the empty feature modules.

- [ ] pnpm workspaces + Turborepo
- [ ] Next.js app (empty routes)
- [ ] Drizzle setup (Postgres connection, schema directory)
- [ ] Better Auth setup (orgs plugin, sessions)
- [ ] Tailwind + shadcn setup
- [ ] Fumadocs setup
- [ ] oRPC skeleton (empty contracts)
- [ ] Hono skeleton (mounted in Next.js at `app/api/[[...route]]/route.ts`)
- [ ] Trigger.dev setup
- [ ] Upstash Redis client
- [ ] Cloudflare R2 client
- [ ] Stripe SDK setup
- [ ] Resend setup
- [ ] `.env.example` with all required env vars
- [ ] `pnpm dev` works end-to-end (no features yet)

**Definition of done:** `pnpm install && pnpm dev` brings up an empty Next.js app with the docs site at `/docs`. No features work yet, but the stack is wired.

### M1: Auth + Orgs (weeks 2-3)

The most-load-bearing feature. Everything else (org-scoped data, RBAC, billing) depends on this.

- [ ] Better Auth: email/password, magic links, Google OAuth
- [ ] Better Auth: orgs plugin (multi-org per user, org switcher in UI)
- [ ] Better Auth: sessions, 2FA, passkeys
- [ ] Better Auth: admin plugin (admin can impersonate users)
- [ ] Better Auth: rate-limit plugin (using Upstash Redis)
- [ ] Sign-up / sign-in / sign-out pages
- [ ] Org creation flow
- [ ] Org switcher in the header
- [ ] Admin user list
- [ ] First org-scoped data model (the `orgs` table + a generic `orgScoped` mixin)

**Definition of done:** A new buyer can sign up, create an org, switch between orgs, and an admin can impersonate any user. The session is stored in Upstash Redis.

### M2: RBAC (weeks 3-4)

Depends on M1 (orgs).

- [ ] Drizzle schema: `roles`, `permissions`, `rolePermissions`, `memberRoles`
- [ ] Seed 4 default roles per org: owner, admin, member, billing
- [ ] RBAC helper: `requirePermission(orgId, userId, permission)`
- [ ] UI: role editor (admin can change member roles)
- [ ] UI: permission gates (UI hides actions the user can't perform)
- [ ] Impersonation UI (admin can impersonate any user)
- [ ] Audit log table + UI

**Definition of done:** An admin can grant/revoke roles. The UI respects permissions. The audit log records every role change and impersonation.

### M3: Billing (weeks 4-5)

Depends on M1 (orgs).

- [ ] Stripe setup: products, prices (3 SKUs × 3 tiers = 9 price points, or 3 SKUs × 1 monthly = 3 if annual only)
- [ ] Customer portal wired
- [ ] Org-scoped subscriptions (each org has its own subscription)
- [ ] Webhook handler: subscription created / updated / cancelled
- [ ] UI: pricing page, checkout, customer portal link
- [ ] Usage-based add-on hook (for future LLM token metering)
- [ ] Trial period: 14 days, no card required

**Definition of done:** A buyer can sign up, get a 14-day trial, see the pricing page, and complete a Stripe checkout. The org's subscription status is reflected in the UI.

### M4: Operational features (weeks 5-7)

These can be built in parallel by different contributors (or sequentially by one person).

- [ ] **Onboarding wizard** (8 steps, see [`onboarding.md`](./onboarding.md))
- [ ] **Mails** (Resend): auth templates (verify, reset, invite), billing templates, transactional
- [ ] **Storage** (R2): avatar upload, org asset upload, export downloads
- [ ] **In-app notifications** (Upstash Realtime): bell icon, dropdown, mark-as-read, categories, message history
- [ ] **i18n** (en only): route + content + email translatable, `en` JSON ships
- [ ] **Blog** (Fumadocs blog): first post, SEO, RSS
- [ ] **Documentation** (Fumadocs): "Getting Started", "Architecture", "Deleting features" (flagship), "API Reference", "Deployment"

**Definition of done:** Every operational feature in the README ships. The buyer can complete the wizard, send/receive mail, upload files, receive notifications, and read the docs.

### M5: API + SDK + CLI (weeks 7-8)

Depends on M0 (the contracts), parallelizable with M4.

- [ ] oRPC contracts for every internal endpoint
- [ ] Hono routes for the public API
- [ ] OpenAPI generation pipeline
- [ ] TypeScript SDK generated from OpenAPI
- [ ] CLI scaffold (Node or Bun, TBD)
- [ ] CLI commands: `login`, `init`, `deploy`, `logs`, `<product-specific>` (TBD per buyer)
- [ ] SDK + CLI share the same OpenAPI source of truth

**Definition of done:** The public REST API is documented. The SDK is published to npm. The CLI installs and authenticates against the public API.

### M6: AI primitives (weeks 8-9)

- [ ] LLM provider abstraction (OpenAI, Anthropic, Gemini, OpenRouter) via Vercel AI SDK
- [ ] Structured output as first-class (Zod schemas → typed LLM calls)
- [ ] Streaming UI primitives (drop-in components)
- [ ] Agent loops (tool calling, multi-step, human-in-the-loop)
- [ ] Per-tenant cost tracking + token budgets (using Upstash Redis for metering)

**Definition of done:** A buyer can wire an LLM call with structured output, stream the response, run an agent loop with tool calling, and have every LLM call metered per tenant.

### M7: Landing page + sales (weeks 9-10)

- [ ] Landing page (per copy in [`positioning.md`](./positioning.md))
- [ ] Stripe checkout wired
- [ ] Email capture for the launch list
- [ ] Analytics (Plausible or similar)
- [ ] First public artifact: a demo end-to-end app on the new stack, deployed and linked from the landing page

**Definition of done:** A buyer can land on deessejs.com, read the copy, click "Buy Solo $299", complete Stripe checkout, and have the repo + license key in their inbox within 5 minutes.

### M8: Pre-launch QA (week 10)

- [ ] All delete tests pass (every feature can be removed cleanly)
- [ ] All docs pages reviewed
- [ ] The wizard tested with 5 fresh users
- [ ] The onboarding first-hour measured (target: 30 minutes for technical founder)
- [ ] Security review (OWASP top 10, Better Auth defaults, Stripe webhook validation)
- [ ] Performance check (Lighthouse, server response times)

**Definition of done:** v1 is ready to ship. All checklist items checked.

## v2 scope (post-launch)

Documented so we don't re-litigate them in the v1 build:

- RAG / vector DB (architecture reserved in v1, no provider)
- Observability (Langfuse is the candidate)
- Evals (Promptfoo is the candidate, paired with observability)
- Multi-locale (architecture translatable in v1, only `en` ships)
- Multi-tenant variant (the template is single-tenant in v1)
- OAuth flows in the wizard (manual credential paste in v1)
- Mobile native apps (not on the roadmap)
- Voice / video as primary modalities (not on the roadmap)

## Dependencies (the load-bearing ones)

```
M0 (scaffold) → M1 (auth + orgs) → M2 (RBAC)
                              → M3 (billing)
                              → M4 (operational features, parallel)
                              → M5 (API + SDK + CLI, parallel with M4)
                              → M6 (AI primitives, after M4)
                              → M7 (landing + sales)
                              → M8 (pre-launch QA)
```

The critical path is M0 → M1 → M2 → M3 → M4 → M6 → M7 → M8. M5 (API + SDK + CLI) can run in parallel with M4 and M6. The whole v1 is ~10 weeks for one developer, ~6 weeks for two.

## Risk: what blows the timeline

1. **Better Auth orgs plugin limitations.** If the orgs plugin doesn't support a feature we need (e.g. cross-org data sharing), we extend it. Risk: 1-2 weeks if the extension is non-trivial.
2. **oRPC + Hono contract sharing.** The "one source of truth for the public API" pattern is well-supported but new. If we hit a wall, fallback: generate OpenAPI from oRPC, then re-implement in Hono manually. Doubles the work for the API surface.
3. **Upstash Realtime's billing model.** At scale, real-time notifications could get expensive. The free tier is generous; paid is reasonable. If we hit an edge case, fallback: DIY SSE.
4. **Stripe webhook reliability.** Webhooks fail. The handler needs to be idempotent and resilient. Risk: 1 week of QA.
5. **The wizard testing.** 5 fresh users to test the first hour. If the median is 90 minutes instead of 30, the wizard needs more work. Risk: 1-2 weeks of iteration.
6. **Documentation.** Docs are a feature, not an afterthought. If the docs take 2x longer, v1 slips. Allocate explicit time (not "as we go").

## Milestones (the check-in points)

- **End of M0:** Stack is wired. The wizard doesn't work yet, but the foundations are solid.
- **End of M1:** A user can sign up and create an org. The wedge's foundation is real.
- **End of M2:** RBAC is functional. The buyer can start building real features.
- **End of M3:** Billing is wired. Revenue is possible.
- **End of M4:** The wizard works. The first hour is polished.
- **End of M5:** The public API ships. The buyer can integrate with their own customers.
- **End of M6:** AI primitives are wired. The buyer can ship AI features.
- **End of M7:** The landing page is live. Sales are possible.
- **End of M8:** v1 ships.

## Open roadmap questions

- **One developer or two?** Affects total timeline. Recommendation: two, parallelizing M4 / M5 / M6.
- **Pre-launch waitlist?** Capture emails 4-6 weeks before launch via a "coming soon" page. Worth doing.
- **Beta buyers?** Get 10-20 founders to test v1 for free in exchange for testimonials. They de-risk the wizard.
- **Launch sequence:** Product Hunt first, then Indie Hackers, then a Show HN. Sequence matters for the SEO boost.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Architecture: [`architecture.md`](./architecture.md) — stack + modular contract
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge + copy
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Research: [`research.md`](./research.md) — research summary
- Onboarding: [`onboarding.md`](./onboarding.md) — wizard + first hour
- Competitive teardowns: [`competitive-teardowns.md`](./competitive-teardowns.md)
