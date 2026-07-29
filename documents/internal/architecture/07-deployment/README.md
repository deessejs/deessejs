# `07-deployment/` — Deployment architecture

## Purpose

Where each piece of the system runs in production, how it's configured, and how changes ship. The bridge between "what the code does" (`01-stack/`, `04-api-surface/`) and "what runs in the cloud".

## What's in here

- `README.md` (this file) — the deploy targets and the matrix.
- `vercel.md` — the primary target: Next.js + Hono + edge config, env vars, preview deploys, build limits.
- `cloudflare.md` — the alternative target: Workers + R2, when to choose it over Vercel.
- `railway.md` — for the buyer who wants a single-host Node deploy.
- `env-vars.md` — the **complete catalogue** of environment variables, grouped by service, with required vs optional, dev vs prod, and secrets.
- `ci-cd.md` — GitHub Actions pipelines: test, lint, typecheck, build, deploy, delete tests, Lighthouse.

## Deploy matrix (current)

| Service | Deployed to | Configured by |
|---|---|---|
| Web app + internal RPC | Vercel (Next.js) | `vercel.md` |
| Public REST API | Vercel (mounted in Next.js) | `04-api-surface/hono-public.md` |
| Background jobs | Trigger.dev Cloud | `01-stack/trigger-dev.md` |
| Postgres | Buyer choice (Neon / Supabase / Railway) | env var only |
| Redis / Realtime | Upstash | env var only |
| File storage | Cloudflare R2 | `01-stack/cloudflare-r2.md` |
| Mail | Resend | env var only |
| Billing | Stripe | env var only |
| Docs + blog | Same Next.js app (Fumadocs) | included |

## Conventions

- **Every env var is documented in `env-vars.md`.** If you add one, update the doc in the same PR.
- **Secrets never in `.env.example`.** Placeholders only.
- **CI runs on every PR.** Production deploys require a green CI and a human approval.
- **Preview deploys per PR** for visual review. Buyer-facing surfaces only.
- **Build limits matter.** Vercel Pro caps concurrent builds at 12; Cloud v0 plans around that.

## Related

- [`00-system-overview/deployment-view.md`](../00-system-overview/deployment-view.md) — high-level topology.
- [`../product/deessejs-cloud-feasibility-2026-06.md`](../../product/deessejs-cloud-feasibility-2026-06.md) — the managed-tier story (separate product, post-v1).
- [`06-security/secrets-management.md`](../06-security/secrets-management.md) — secret handling rules.
- [`10-decisions/`](../10-decisions/) — deploy-target decisions and their context.
