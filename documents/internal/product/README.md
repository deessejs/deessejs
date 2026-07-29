# DeesseJS — Product Brief

> **Status:** Positioning + stack + pricing decisions landed, build not started. Living document — source of truth for the product spec. For deep-dives see the supporting docs in this folder.

## What it is

**DeesseJS** is a **commercial Next.js fullstack starter template**, sold (one-time, lifetime license) to founders and small teams who want to ship a SaaS product without rebuilding auth, orgs, billing, blog, docs, mails, storage, AI primitives, jobs, CLI, API, i18n, and in-app notifications from scratch.

The product is a git repo the buyer downloads, with a polished landing-page sales surface and Stripe checkout. It is **not** a hosted platform and **not** a no-code builder.

## Target buyer

- **Who:** Solo founders and small startup teams (2–5 people) building a SaaS in the next 30–90 days.
- **Pain they pay to solve:** "I want to ship this weekend, not spend month 1 wiring the same plumbing every SaaS needs."
- **What they will not tolerate:** Half-baked features, a chatbot demo passed off as AI, RBAC that's just a boolean, a CLI that doesn't ship, a docs site that's an afterthought, or a template where deleting one feature breaks the rest.

## Positioning (the wedge)

**"The Apple of SaaS templates."** Two commitments, equal weight:

1. **Completeness** — every feature ships out of the box. The buyer does not need another template on top of this one.
2. **DX (easiest to customize)** — opinionated defaults, strong conventions, modular architecture, easy to delete what you don't need, great docs. The buyer can shape this to their product without fighting it.

No competitor in the $299-999 band owns both axes. ShipFast is lean. SaasRock is heavy. Makerkit is fragmented. **supastarter competes on completeness too** — DeesseJS is the only one that's complete out of the box AND truly modular (delete what you don't need).

**What this means for the AI story:** AI primitives (Vercel AI SDK, structured output, streaming, agent loops, per-tenant cost tracking) ship and are well-built, but are not the headline. Vector DB / RAG and observability / evals are deferred for v1. The wedge is the overall product experience, not the AI layer.

> Full brand, wedge, and copy details in [`positioning.md`](./positioning.md). Design rules in this README under "Design principles" below.

## Pricing

**3 tiers, one-time payment, lifetime license.** No recurring/subscription tier (universal in the band).

| Tier | Price | What you get |
|---|---|---|
| **Solo** | $299 | 1 app, 1 seat, all features, community Discord, 1 year of updates |
| **Team** | $599 | Up to 3 apps, up to 10 seats, all features, email support (48h), 1 year of updates |
| **Studio** | $999 | Unlimited apps & seats, white-label rights, priority + Slack support, lifetime updates, 1 onboarding session |

**Gate philosophy:** *Consistent* — all tiers get the full feature set. Gates are commercial (app count, seat count, support level, updates window, white-label rights, onboarding). Aligns with the "no half-built features" design principle.

> Full pricing strategy, concrete gates, and open pricing questions in [`pricing.md`](./pricing.md).

## Stack

Locked unless explicitly reopened. Every choice traces to a reason in [[project-stack-and-scope-2026-06]].

| Concern | Choice | Note |
|---|---|---|
| Framework | **Next.js** | |
| ORM | **Drizzle** | |
| Auth | **Better Auth** | orgs + plugins (sessions, 2FA, passkeys, magic links, MFA, admin, rate-limit) |
| UI | **Tailwind + shadcn** | shadcn copied in, customized, design tokens, themeable per-tenant |
| AI SDK | **Vercel AI SDK** | provider abstraction floor |
| Background jobs | **Trigger.dev** | code-first |
| Docs + Blog | **Fumadocs** | includes blog |
| API (internal) | **oRPC** | type-safe, OpenAPI-native, shares contracts with public API |
| API (public) | **REST with Hono, mounted in Next.js** | one deploy, R2 over public S3 API |
| CLI | **User-facing CLI** (gh/vercel-style) | ships with the buyer's product, not a scaffolder |
| SDK | **Auto-generated TS SDK** from Hono OpenAPI | modern SaaS pattern (Stripe, Resend) |
| Payments | **Stripe** | confirmed |
| Mail | **Resend** + React Email | confirmed |
| Storage | **Cloudflare R2** | S3-compatible, no egress fees |
| Realtime / cache | **Upstash Redis** (REST) | used for notifications + sessions + rate-limit + cache |
| In-app notifications | **Upstash Realtime** on Upstash Redis | typed SSE, real-time, no third-party dashboard |
| i18n | **English only for v1** | architecture translatable, only `en` ships |
| Vector DB | **Deferred for v1** | architecture reserved, no provider wired in |
| Observability | **Skipped for v1** | buyers add their own (Langfuse, Helicone, LangSmith) |
| Evals | **Skipped for v1** | cascade with observability, pair ships in v2 |

> Full architecture rationale, dependency relationships, and the "delete what you don't need" modular contract in [`architecture.md`](./architecture.md).

## Feature pillars

Listed in landing-page order. Operational surface first (this is the wedge), AI primitives as "available, well-built."

### Operational surface (the wedge)

1. **Auth & orgs** — Better Auth (orgs / sessions / 2FA / passkeys / magic links / MFA / admin / rate-limit). Multi-org per user, org-scoped data.
2. **Real RBAC** — ≥ 4 roles (owner / admin / member / billing), fine-grained perms, impersonation, audit log. Target SaasRock's depth.
3. **Billing** — Stripe. Org-scoped subscriptions, usage-based add-ons for LLM tokens, customer portal.
4. **Background jobs** — Trigger.dev. Code-first jobs, retries, queues, observability.
5. **Mails** — Resend + React Email. Templates for auth / billing / transactional.
6. **Storage** — Cloudflare R2. S3-compatible, no egress.
7. **i18n** — English only for v1. Architecture translatable, easy to add locales.
8. **Onboarding** — multi-step wizard + post-signup checklist (org, first project, first AI workflow, billing).
9. **Blog** — Fumadocs blog paired with docs.
10. **Documentation** — Fumadocs, MDX, versioned.
11. **Web app** — Next.js, the template itself.
12. **API (internal)** — oRPC.
13. **API (public)** — REST with Hono, mounted in Next.js.
14. **CLI** — User-facing (gh-style), ships in the buyer's product.
15. **SDK** — Auto-generated TS from Hono OpenAPI.
16. **UI** — Tailwind + shadcn, design tokens, dark mode, themeable per-tenant.
17. **In-app notifications** — Upstash Realtime. Bell icon, dropdown, mark-as-read, categories, deep links, per-user preferences, message history.

### AI primitives (available, well-built)

18. **LLM provider abstraction** — OpenAI / Anthropic / Gemini / OpenRouter via Vercel AI SDK. Structured output (Zod) as first-class.
19. **Streaming UI primitives** — token streaming, multi-modal input (text, image, audio), chat history, tool-call rendering.
20. **Agent loops** — tool-calling, multi-step reasoning, human-in-the-loop checkpoints, per-tenant rate-limiting.
21. **Per-tenant cost tracking & token budgets** — meter every LLM call against the tenant, enforce hard caps.
22. **RAG / vector DB** — *deferred for v1*. Architecture reserved (ingestion / chunking / retrieval interfaces), no provider wired in. Re-evaluate post-launch.
23. **Observability & tracing** — *skipped for v1*. Buyers add their own.
24. **Evals** — *skipped for v1* (cascade).

## Design principles (load-bearing)

These are the rules of the build. If a decision violates one, the decision is wrong.

1. **Opinionated defaults.** We make the choice. The buyer overrides if they need to.
2. **Modular by default.** Every feature can be removed without breaking the rest. The buyer can delete a feature and the app still runs.
3. **One coherent product, not a collection of parts.** Same UI patterns, same naming, same error handling, same auth flow, same billing story across the surface.
4. **Docs are a feature, not an afterthought.** Fumadocs ships with the template. The buyer's first hour is reading the docs.
5. **Polished UX everywhere.** Every screen, every empty state, every error. Not a chatbot demo — a *product*.
6. **No half-built features.** If it's not done, it doesn't ship. Better to ship 10 features at 100% than 18 at 80%. "Apple" positioning breaks on the first half-baked screen.

## Non-goals (for v1)

- Multi-tenant SaaS (the *template* is single-tenant; multi-tenant is what the buyer builds on top).
- A hosted / no-code variant.
- Mobile native apps.
- Voice / video as primary modalities (multi-modal input yes; voice agents no).
- A marketplace for add-ons.
- Free / OSS tier (none of the direct competitors have one — see [`pricing.md`](./pricing.md) for the open question).
- RAG / vector DB / observability / evals (deferred to v2; see [`architecture.md`](./architecture.md)).

## Competitive landscape

| Name | Price | Stack | AI depth | What they win on |
|---|---|---|---|---|
| supastarter | €349 / €799 / €1,499 | Next.js | Vercel AI SDK chat, streaming | **Competes on the same "completeness" axis as DeesseJS**; config-driven multi-tenancy toggles |
| Makerkit | $299 / $599 | Next.js (3 parallel stacks) | Dev-side only (MCP, AI agent rules) | Stack choice, mature ecosystem |
| ShipFast | $199 / $249 / $299 | Next.js | Zero native LLM modules | Distribution (Marc Lou brand, 135k Twitter) |
| TurboStarter | $249 / $399 | Next.js (multi-app) | "AI Kit": providers, tool calling, memory | Multi-app (web + mobile) |
| SaasRock | $249 / $499 / $1,999 | **Remix / RR7** | Prompt Flow Builder (OpenAI-only) | RBAC depth (6 roles, 30 perms, impersonation, GDPR) |
| Nexty (nextforge) | $188 | Next.js | Multi-modal demos (chat / t2i / i2i / video) | Price, multi-modal showcase |

> Detailed teardowns and per-competitor pricing notes in [[reference-template-competitors]] in agent memory.

## Distribution

- **Own landing page + Stripe checkout** — universal in the band. No Gumroad / Lemon Squeezy observed.
- **Launch channels:** Product Hunt (every competitor has launched there), Indie Hackers, X/Twitter (long game, not a launch tactic).
- **SEO:** long-tail keywords anchored on completeness + DX ("Next.js SaaS template with orgs and billing", "Next.js template that ships everything", "opinionated Next.js starter") — winnable because no competitor owns that framing.
- **Content:** design-principle write-ups ("why we ship a CLI as a product feature", "how we make every feature deletable") double as SEO and as proof of the Apple positioning.

We **do not** try to copy ShipFast's distribution — that's a one-person brand moat, not a replicable strategy.

## Current status

- [x] Initial market research (2026-06-16) — [[project-market-research-2026-06]]
- [x] Buyer-voice research (2026-06-16) — [[project-buyer-voice-2026-06]]
- [x] Positioning: "Apple of SaaS templates" = completeness + DX — [[project-positioning-hybrid-2026-06]]
- [x] Design principles (6 rules)
- [x] Core stack decisions: Next.js, Drizzle, Better Auth, Vercel AI SDK, Trigger.dev, Fumadocs
- [x] API architecture: oRPC (internal) + Hono REST (public, mounted in Next.js)
- [x] CLI scope: user-facing gh/vercel-style
- [x] SDK: auto-generated TS from Hono OpenAPI
- [x] UI: Tailwind + shadcn
- [x] Mail: Resend + React Email
- [x] In-app notifications: Upstash Realtime on Upstash Redis
- [x] Storage: Cloudflare R2
- [x] i18n: English only for v1
- [x] Vector DB / observability / evals: deferred/skipped for v1
- [x] **Brand name: DeesseJS**
- [x] **Pricing structure: Solo / Team / Studio at $299 / $599 / $999, consistent gate philosophy**
- [ ] **Concrete tier gates** (Solo seat count, Studio SLA, etc.) — see [`pricing.md`](./pricing.md)
- [ ] Landing page copy draft, anchored on completeness + DX + the Stain Lu quote
- [ ] First public artifact: a demo end-to-end app on the new stack (one feature done to 100%, as proof of "no half-built features")

## Open questions

The current load-bearing question is **concrete tier gates** for the $299 / $599 / $999 structure. Secondary questions:

- Recurring revenue: leave margin on the table, or test a support/upgrades subscription?
- Free OSS tier as top-of-funnel? (None of the direct competitors have one.)
- Solo tier price risk: is $299 too high for first-time founders when ShipFast exists at $199?
- Repo directory rename from `complete-template/` to `deessejs/` (operational, not product).

> Tracked in detail in [`pricing.md`](./pricing.md) and the [[project-positioning-hybrid-2026-06]] memory.

## Related documents

In this folder:
- [`features.md`](./features.md) — the **complete features inventory** (~200 features, 20 surfaces, status + source + rationale per feature) — **read this for "what do we ship"**
- [`architecture.md`](./architecture.md) — full stack rationale, dependency graph, modular contract
- [`positioning.md`](./positioning.md) — brand, wedge, copy angles, distribution
- [`pricing.md`](./pricing.md) — pricing strategy, concrete tier gates, open pricing questions
- [`research.md`](./research.md) — market research + buyer voice findings (summary)
- [`onboarding.md`](./onboarding.md) — wizard design, the buyer's first hour, "Deleting features" flagship doc
- [`competitive-teardowns.md`](./competitive-teardowns.md) — per-competitor deep-dive (supastarter, ShipFast, Makerkit, SaasRock, TurboStarter, Nexty)
- [`build-roadmap.md`](./build-roadmap.md) — v1 build sequence, milestones, critical path, risk
- [`open-questions.md`](./open-questions.md) — consolidated open questions with priority, blockers, decisions
- [`unmet-needs-2026-06.md`](./unmet-needs-2026-06.md) — unmet-needs analysis (2026-06-16): top 10 + backlog + surprises + what NOT to ship + cross-validation against the spec
- [`v2-features.md`](./v2-features.md) — the v2 features backlog: every feature deferred from v1, with one-line rationale. The "what we don't ship" defensive list.
- [`deessejs-cloud-feasibility-2026-06.md`](./deessejs-cloud-feasibility-2026-06.md) — DeesseJS Cloud feasibility report: managed SaaS template, per-client Vercel Platforms + Turso + Upstash, single `DEESSEJS_SECRET` env var. Recommendation: build v0 behind a 30-tenant private beta in 2026-Q3.
- [`lead-magnets.md`](./lead-magnets.md) — the lead magnet strategy. Recommended primary: DeesseJS Lite (public mini-template on GitHub). Plus 3-tier combined strategy (Lite + State of SaaS Templates 2026 report + public demo) and the "anti-competitive twist" (Buyer's Guide as the most differentiating lead magnet).

In `.claude/agent-memory/head-of-product/`:
- `project-purpose` — what DeesseJS is, why
- `project-market-research-2026-06` — first research pass (competitor set, AI depth gap)
- `project-buyer-voice-2026-06` — second research pass (wedge validation, Stain Lu quote)
- `project-stack-and-scope-2026-06` — stack decisions with rationale
- `project-positioning-hybrid-2026-06` — wedge + design principles
- `reference-template-competitors` — verified competitor set
- `reference-upstash-realtime` — Upstash Realtime reference
- `user-role` — user is founder/PM
- `user-language` — user prefers English replies
