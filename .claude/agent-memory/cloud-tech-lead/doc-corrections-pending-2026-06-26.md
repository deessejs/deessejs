---
name: doc-corrections-pending-2026-06-26
description: Action items from the 2026-06-26 fresh research sweep — explicit list of what to fix in which doc, derived from [[research-snapshot-2026-06-26]].
metadata:
  type: project
---

This is the working list of doc corrections surfaced by the 2026-06-26 fresh research sweep. The user has not yet acted on these — they're the "next moves" for the docs when the user opens that conversation. **Why:** keeping them here so I don't have to re-derive them next time, and so the user can see the full delta at a glance.

## How to apply

When the user asks about Cloud docs, this file is the action queue. Walk through it table-first; don't make them re-ask "what did we find?"

When the user signs off on a correction, mark it done here (delete the row or move it to a "resolved" sub-list) and link the actual diff/commit.

## Pending corrections (Vercel deep-dive — 2026-06-26 round 2)

Findings from a focused `@vercel/sdk` + REST API + OIDC Federation + Webhooks + Build Queues sweep.

| # | Doc affected | Change | Source / reason |
|---|---|---|---|
| V1 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: Shared env var pattern for `DEESSEJS_SECRET_PUBLISHER_KEY`. Create once at team level, link to each tenant project via `environmentUpdateSharedEnvVariable`/`environmentUnlinkSharedEnvVariable`. Rotation = single update. **Caveat:** propagation delay on rotate not verified — to test in pre-prod. | @vercel/sdk README `environment*` namespace methods. |
| V2 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: OIDC Federation direction tenant app → control plane. Flow: `getVercelOidcToken({ audience: 'app.deessejs.com' })` → control plane verifies via JWKS `oidc.vercel.com/[team]/.well-known/jwks` using `jose.jwtVerify`. RS256, lifetime 1h (prod/preview) / 12h (dev). **OPEN:** "Secure backend access with OIDC federation" permission — Enterprise-only or free? Verify before commit. | `vercel.com/docs/oidc/api`, `vercel.com/docs/oidc/reference`. |
| V3 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add explicit "Marketplace Partner API is OUT of scope for our model" — to prevent re-debate. The Partner API is for SaaS wanting to be installed INTO customers' teams. Our control plane creates projects on OUR operator team. | `vercel.com/docs/integrations/create-integration/marketplace-api/reference`. |
| V4 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: Native webhooks vs Integration webhooks distinction. Native (project.*, deployment.*, domain.*) use `WEBHOOK_SECRET`. Integration (Marketplace) uses `INTEGRATION_SECRET` with HMAC-SHA1. We use the **native** path. Implement dedup table on `(webhook_id, delivery_id)`. | `vercel.com/docs/webhooks/webhooks-api`. |
| V5 | `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` | Re-rank risks: **build concurrency is now Risk #1**, ahead of "12-concurrent ceiling" (which is just one expression of the same bottleneck). For the 4-6 min SLA in bursts of 10+ tenants/day, the **On-Demand Concurrent Builds add-on** is required. Cost to budget. For >1000 tenants/mo, Enterprise Urgent On-Demand Concurrency ($20K+/yr) becomes unavoidable. | `vercel.com/docs/builds/build-queues`. |
| V6 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: `@vercel/sdk` v1.21.x as the canonical client. ESM, Zod-typed, auto-generated from OpenAPI, tree-shakeable, configurable retry with backoff. MCP SDK is a dep — note for future agent-side tooling. Auth via `bearerToken` from Workers Secret. | `npmjs.com/package/@vercel/sdk`. |
| V7 | `documents/internal/product/cloud/B3-secret-lifecycle.md` | Update: `DEESSEJS_SECRET` carries the **publisher key only** (Ed25519 public). The full credential bundle (Turso URL, Turso auth, Upstash REST, Trigger secret, X25519 pub) is delivered via `POST /exchange` PASERK seal. The publisher key may live in a **shared env var** linked per-tenant for rotation efficiency. | V1 above + existing B3 model. |

## Pending corrections (initial 2026-06-26 sweep)

## Pending corrections (priority order)

| # | Doc affected | Change | Source / reason |
|---|---|---|---|
| 1 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Replace "Trigger.dev v3" with "Trigger.dev v4 GA (2025-08-18)"; capture Waitpoints primitive for idempotency. | v4 GA changelog. |
| 2 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: `maxDuration=1800` is per-function only during beta. `"max"` resolves to 800s, not 1800s. Secure Compute does NOT support >800s. | Vercel duration doc. |
| 3 | `documents/internal/product/cloud/A2-vercel-platforms.md` | Add: Fluid Compute default since 2025-04-23 on all new projects. Don't need to opt-in, just don't disable. | Vercel Fluid doc. |
| 4 | `documents/internal/product/cloud/A2-vercel-platforms.md` OR new `A4-control-plane-runtime.md` | Capture: control plane HTTP wall time is unlimited while client connected. `waitUntil()` +30s after response/disconnect. Cron/Queue/DO alarms capped 15 min wall. Update the 25s/300s envelope assumption. | CF Workers limits doc updated 2026-06-25. |
| 5 | `documents/internal/product/cloud/B4-llm-metering.md` §2 | Add: Global Upstash writes cost × N regions. For 30 tenants, **Regional**. Global's eventual consistency is wrong for billing reads. | Upstash Global DB doc. |
| 6 | `documents/internal/product/cloud/B4-llm-metering.md` §2 | Add: Trigger.dev v4 Waitpoints as the job-side idempotency layer. Wrap LLM-call jobs in Waitpoint-Idempotency-Key. Reconciliation strategy becomes: Stripe is the billing source of truth, Upstash is the cache, Waitpoint prevents double-execution at the job level. | Trigger.dev v4 GA changelog. |
| 7 | `documents/internal/product/cloud/B3-secret-lifecycle.md` | Add: tenant app must hold an X25519 private key to `unseal` the PASERK k4.seal bundle. Two options: (a) template bakes in a per-tenant keypair, (b) first exchange delivers it out-of-band. **Open question — not yet decided.** | PASERK seal spec. |
| 8 | `documents/internal/product/cloud/C3-escape-hatch-and-portability-2026-06.md` | Add to the "4-6h DevOps" estimate: Resend eject = domain deletion + re-verification + DNS re-propagation window. Mail interruption per tenant: minutes to hours. | Resend multi-tenant guide. |
| 9 | `documents/internal/product/deessejs-cloud-feasibility-2026-06.md` | Update Risk #5: 300s ceiling claim is dead. Replace with "30 min on Pro/Enterprise beta (Fluid Compute + per-function opt-in)." | Vercel 30-min changelog. |
| 10 | New `documents/internal/product/cloud/B5-metering-cost-model.md` (gap fill) | Capture Regional vs Global Upstash math, bundle vs unbundle Stripe usage records, unit economics at 30 → 100 → 1000 tenants. Needed for the 87% gross margin floor. | This research sweep + A2/B4 context. |
| 11 | New `documents/internal/product/cloud/A4-control-plane-runtime.md` (gap fill) OR amend A2 §2 | Streaming pattern for `POST /tenants` (long-lived connection showing provisioning steps) and `POST /exchange` (15-min TTL PASERK seal minting). HTTP/2 PING handling for HTTP/1.1 fallback. | CF Workers limits + Vercel duration docs. |

## Why these are pending

The user kicked off a `fresh` deep research sweep on 2026-06-26 ("fouille sur le web avec fresh en profondeur pour en apprendre plus sur toutes ces technologies"). I ran the sweep, captured everything in [[research-snapshot-2026-06-26]], and summarized the synthesis inline. The user has not yet decided which corrections to apply first.

**Next move the user could make:**
- "Open A4 first" — opens a new doc on control plane runtime limits + Edge streaming patterns.
- "Amend the README's vendor stack baseline" — pulls the drift summary into the source-of-truth README.
- "Update the feasibility doc's Risk #5" — minimal diff, kills a known-wrong claim.
- "Open B5" — opens the metering cost model doc (gap fill).
- "Show me the diffs" — generate proposed patches for review before applying.

## How this connects

- Parent synthesis: [[research-snapshot-2026-06-26]] — sources, findings, edge cases, gaps.
- Drift summary (high-level): [[project-cloud-vendor-stack]] § "Drift since last baseline."
- Feasibility doc stale claims (separate, longer-lived issue list): [[project-cloud-feasibility-staleness]].