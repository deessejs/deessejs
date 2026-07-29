# DeesseJS — Architecture

> **Deep-dive on the stack.** The README is the source of truth at the high level; this doc is the technical reference.

## Stack (locked unless reopened)

Every choice in this table traces to a reason. If you're about to swap something, read the rationale section first, then update the table.

| Concern | Choice | Decision date | Rationale |
|---|---|---|---|
| Framework | **Next.js** | 2026-06-16 | Standard for the buyer segment; biggest ecosystem. |
| Language | TypeScript | 2026-06-16 | Full-stack type safety; required for oRPC. |
| Package manager | pnpm (recommended) | default | Modern default; monorepo-friendly. |
| ORM | **Drizzle** | 2026-06-16 | Type-safe, edge-friendly, no codegen step. Aligns with one of Makerkit's three stacks. |
| Auth | **Better Auth** | 2026-06-16 | Native orgs / sessions / 2FA / passkeys / magic links / MFA / admin / rate-limit. Saves months of work. |
| UI | **Tailwind + shadcn** | 2026-06-16 | shadcn copied in (not a dependency), design tokens, themeable per-tenant. |
| AI SDK | **Vercel AI SDK** | 2026-06-16 | Universal LLM provider abstraction floor. |
| Background jobs | **Trigger.dev** | 2026-06-16 | Code-first ergonomics over Inngest's event-driven model. |
| Docs + Blog | **Fumadocs** | 2026-06-16 | Polished, versioned, MDX. Includes blog — one surface for docs and posts. |
| API (internal) | **oRPC** | 2026-06-16 | Type-safe, OpenAPI-native (so the public Hono API can share contracts), runtime-agnostic. |
| API (public) | **REST with Hono, mounted in Next.js** | 2026-06-16 | One deploy, full Node API, oRPC contract sharing is trivial. Tradeoffs: no edge benefits; R2 over public S3 API (not a binding). |
| CLI | **User-facing CLI** (gh/vercel-style) | 2026-06-16 | Ships inside the buyer's product, installable by their end users. Real differentiator — almost no competitor in the band does this. |
| SDK | **Auto-generated TS SDK** from Hono OpenAPI | 2026-06-16 | Modern SaaS pattern (Stripe, Resend). Same source of truth as the CLI. |
| Payments | **Stripe** | 2026-06-16 | Universal, well-known, supports the org-scoped subscription + usage-based add-on model we need. |
| Mail | **Resend** + React Email | 2026-06-16 | React Email gives us component-composed email templates; Resend is the delivery layer. |
| Storage | **Cloudflare R2** | 2026-06-16 | S3-compatible, no egress fees, $0.015/GB/month. Pairs with the rest of the stack. |
| Realtime / cache | **Upstash Redis** (REST) | 2026-06-16 (via Upstash Realtime) | Used for notifications, sessions, rate-limit, cache. One vendor, one dashboard. |
| In-app notifications | **Upstash Realtime** on Upstash Redis | 2026-06-16 | Typed SSE pub/sub, real-time, no third-party dashboard, generous free tier. |
| i18n | **English only for v1** | 2026-06-16 | Architecture translatable; only `en` ships. Other locales easy to add. |
| Vector DB | **Deferred for v1** | 2026-06-16 | Architecture reserved (ingestion / chunking / retrieval interfaces), no provider wired in. Re-evaluate post-launch. |
| Observability | **Skipped for v1** | 2026-06-16 | Buyers add their own (Langfuse, Helicone, LangSmith). Revisit in v2. |
| Evals | **Skipped for v1** | 2026-06-16 (cascade with observability) | Evals without observability is half a story; pair ships in v2. |

## Dependency relationships

```
                ┌────────────────────────┐
                │       Next.js app       │
                │   (web + admin + blog)  │
                └────────────┬───────────┘
                             │
        ┌────────────────────┼─────────────────────┐
        │                    │                     │
   ┌────▼─────┐      ┌───────▼────────┐    ┌───────▼────────┐
   │  oRPC    │ ◀──▶ │   Hono (REST)  │    │   UI (Tailwind │
   │ (intern) │      │   (public)     │    │   + shadcn)    │
   └────┬─────┘      └───────┬────────┘    └────────────────┘
        │                    │
        │             ┌──────▼──────┐
        │             │  TS SDK     │  (auto-generated from Hono OpenAPI)
        │             │  (to npm)   │
        │             └──────┬──────┘
        │                    │
        │             ┌──────▼──────┐
        │             │  CLI (gh)   │  (consumes the SDK)
        │             └─────────────┘
        │
   ┌────▼──────────────────────────────┐
   │  Better Auth (orgs + plugins)     │
   │  Drizzle (Postgres)               │
   │  Upstash Redis (sessions, cache)  │
   │  Cloudflare R2 (storage)          │
   │  Stripe (billing)                 │
   │  Resend (mail)                    │
   │  Trigger.dev (background jobs)    │
   │  Upstash Realtime (notifications) │
   └───────────────────────────────────┘
```

**The shared services** (Postgres via Drizzle, Upstash Redis, R2, Stripe, Resend, Trigger.dev) are what the buyer provisions once and uses across the entire stack. No vendor sprawl.

## The "delete what you don't need" modular contract

This is the wedge's proof point. It must be true, not just promised.

**The contract:**
1. Every feature is in a self-contained module under `src/features/<name>/`
2. Each module has a single `index.ts` that re-exports its public surface
3. The app routes only import from these `index.ts` files — never from internal module files
4. To delete a feature, the buyer:
   - Deletes `src/features/<name>/`
   - Removes the import from the relevant route(s) (one or two files)
   - Removes any schema from `db/schema/` that was feature-only
   - Removes any env vars from `.env.example`
   - Removes the docs page from `content/docs/`
5. The rest of the app continues to work. No broken imports, no missing types, no dead routes.

**How we prove it in docs:** a "Deleting features" page in Fumadocs walks through deleting the in-app notifications feature end-to-end, with screenshots. The reader finishes the doc having deleted a feature and confirmed the app still runs.

**Test discipline:** every feature module has a "delete test" — `pnpm test:delete --feature=notifications` removes the module, runs the test suite, fails loudly if anything else broke.

## What the buyer provisions

When the buyer buys DeesseJS, they sign up for:

| Service | What for | Free tier covers |
|---|---|---|
| **Postgres** (their choice of host) | Main data via Drizzle | Varies by host (Neon, Supabase, Railway all have free tiers) |
| **Upstash Redis** | Notifications, sessions, rate-limit, cache | 256MB, 500K commands/month (enough for indie indefinitely) |
| **Cloudflare R2** | File storage | 10GB / 10M reads / 1M writes per month free |
| **Stripe** | Billing | Free until first charge |
| **Resend** | Mails | 100 emails/day, 3,000/month free |
| **Trigger.dev** | Background jobs | Free tier (10K job runs/month) |

**5 external services + Postgres = 6 things to sign up for.** The onboarding wizard walks the buyer through this in order. The wizard is itself a feature — treated with the same polish as everything else.

## Architecture decisions deferred to v2

Documented so we don't re-litigate them:

- **RAG / vector DB provider** — pgvector (cheapest, ships with Postgres) is the default if we ship in v2. Pluggable to Pinecone / Turbopuffer via adapter.
- **Observability tool** — Langfuse if we ship (LLM-specific, better fit for our primitives than Helicone).
- **Evals** — Promptfoo or Braintrust, paired with observability.
- **Multi-tenant SaaS variant** — the template is single-tenant; multi-tenant is the *buyer's* job to build on top.
- **Hosted / no-code variant** — explicitly not on the roadmap.
- **Mobile native apps** — explicitly not on the roadmap.

## Cross-references

- README: [`README.md`](./README.md) — high-level product brief
- Positioning: [`positioning.md`](./positioning.md) — brand + wedge
- Pricing: [`pricing.md`](./pricing.md) — pricing strategy
- Research: [`research.md`](./research.md) — market + buyer voice
- Memory: [[project-stack-and-scope-2026-06]] — full rationale for each choice
