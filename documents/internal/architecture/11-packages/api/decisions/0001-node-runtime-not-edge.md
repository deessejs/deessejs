# 0001. Runtime: Node.js, not Vercel Edge

- **Status:** Accepted
- **Date:** 2026-06-18
- **Deciders:** founder, tech lead
- **Scope:** `packages/api` deployment target, `apps/web` Vercel config

## Context and problem statement

When we deploy the Hono app from `packages/api` on Vercel, we have two runtime options:

1. **Node.js runtime** — Vercel Functions on Node 20+, with full Node API access (fs, crypto, net, child_process, etc.). The default for Hono on Vercel.
2. **Edge runtime** — Vercel Edge Functions, Web-standard APIs only. Smaller cold start, lower memory, but significant constraints.

Vercel Fluid Compute (the recommended runtime) runs on Node 20+ for Pro/Ent. Edge is a separate runtime with a different deployment model.

The choice affects which dependencies we can use, which deploy model the buyer has, and what perf profile we ship.

## Considered options

### Option 1 — Node.js runtime (chosen)

- Pros:
  - Full Node API access. We can use `postgres-js` (Drizzle driver), `better-auth` with all plugins (including `passkey()` and `twoFactor()`), `trigger.dev` SDK, native crypto.
  - Bundle size up to 250 MB. Plenty of headroom for our dep stack.
  - Max duration 1800s (GA) on Pro Node.js/Python with Fluid Compute since 2026-06-15. Comfortable for any API call. The > 1800s tier remains beta.
  - Memory up to 4 GB / 2 vCPU on Pro.
  - Fluid Compute gives us edge-like benefits: optimized concurrency, bytecode caching, multi-AZ failover.
  - The Hono `hono/vercel` adapter works out of the box.
- Cons:
  - Slightly higher cold start than Edge (~50-200ms vs ~5-20ms for Edge).
  - Single-region by default (configurable on Pro/Ent).

### Option 2 — Vercel Edge runtime

- Pros:
  - Lower cold start (~5-20ms).
  - Lower memory footprint.
  - Multi-region by default.
- Cons:
  - **No `node:fs`, limited `node:crypto`** (Web Crypto only).
  - **No `postgres-js`** driver (must use `@neondatabase/serverless` HTTP driver).
  - **Drizzle still works** (it has an edge adapter), but **some features** are limited (notably the `pgPolicy` RLS helpers that require admin role).
  - **Better Auth edge support is partial.** The core works, but some plugins (notably `passkey()` due to WebAuthn library constraints) may not work or require workarounds.
  - **Trigger.dev SDK** has limited Edge support.
  - **Max duration 25s** to start streaming, 300s total. Insufficient for AI streaming + admin operations.
  - **Bundle size 1 MB compressed** (much tighter than Node's 250 MB).
  - **More restrictive logging** — no stdout in the same way; structured logs need a different sink.
  - Buyer confusion: "edge" is marketed as a feature, but for our use case it's a footgun.

### Option 3 — Hybrid (Edge for some routes, Node for others)

- Pros: optimal perf for each route.
- Cons: two deploy targets, two mental models, more CI complexity, more docs to write. For our buyer audience, this is overkill.

## Decision

**Option 1: Node.js runtime on Vercel, with Fluid Compute enabled.** No Edge. No hybrid.

The runtime is set in `apps/web/app/api/[[...route]]/route.ts` (Next.js default) and reinforced in `vercel.json` with `"fluid": true` and `"functions."<path>": { "maxDuration": 800 }`.

## Why

### All our key dependencies require Node

| Dependency | Node-only feature | Impact on Edge |
|---|---|---|
| `postgres-js` (Drizzle driver) | TCP connection to Postgres | Breaks — Edge needs HTTP driver |
| `@better-auth/drizzle-adapter` | Uses `pg` under the hood for some queries | Incompatible with Edge HTTP-only mode |
| `better-auth/passkey` (WebAuthn) | Native crypto for challenge signing | Works on Edge but with limitations |
| `better-auth/twoFactor` (TOTP) | Native crypto for HMAC | Works on Edge |
| `@trigger.dev/sdk` | Long-polling for runs | Limited Edge support |
| `pino` (our logger) | `worker_threads` for non-blocking writes | Degrades on Edge |
| `@aws-sdk/client-s3` (for R2) | Some features require Node streams | Works but heavier |
| `zod-to-json-schema` (oRPC OpenAPI gen) | Pure JS, no native deps | Works on Edge ✓ |

The first three are blockers. We can swap the Postgres driver to `@neondatabase/serverless` for Edge, but we can't easily swap Better Auth or Trigger.dev.

### Fluid Compute gives us most of the Edge benefits

- **Optimized concurrency** — multiple invocations per instance, similar to Edge's "isolate per request" but cheaper.
- **Bytecode caching** (Node 20+) — first-request compile cost is amortized, cold starts are ~10x faster.
- **Active CPU billing** — only pay for code executing, not I/O wait. This is the key economic lever.
- **Multi-AZ failover** — automatic HA in the region.

The only Edge advantages we don't get are **multi-region by default** (single-region on Pro unless we pay for multi-region) and **sub-50ms cold start** (we're at 50-200ms, acceptable for an API).

### The Hono ecosystem is Node-first

- `hono/vercel` works with both runtimes, but the documentation and examples are Node-first.
- The Hono team themselves deploy their docs site on Vercel Node runtime.
- PR #4878 (Next.js 15 App Router fix) was Node-specific.

### Our buyer audience doesn't care about Edge

- Edge is a marketing term that maps to "fast, multi-region." Our buyers care about **cost predictability** (Fluid Compute gives this) and **full feature support** (Node gives this).
- Documenting "we're on Node" is simpler than "we're on Node for the API and Edge for static assets" or similar hybrid.

## Tradeoffs accepted

- **Cold start is ~50-200ms**, not < 50ms. For a SaaS dashboard, this is fine. For a public API consumer (CLI, SDK), it's also fine — the SDK has connection pooling, the first request is the slow one.
- **Single region by default** (the Vercel default region, usually `iad1`). Pro/Ent can configure multi-region. We document the option but don't enable by default — the cost is per-region.
- **Bundle size 250 MB ceiling** instead of Edge's 1 MB. Our dep stack is ~110-150 MB. We have headroom, but if we add a heavy dep (e.g. an image processing library), we might need to split the function. See [`../hosting.md`](../hosting.md) §5 for the mitigation strategies.

## Why we might revisit

- **Vercel ships a true "zero cold start"** model that makes the Node vs Edge trade-off obsolete. Currently, Fluid Compute's bytecode caching gets us close but isn't zero.
- **Better Auth ships full Edge support** for all plugins. As of 1.6.19, `passkey()` and `twoFactor()` have Edge limitations.
- **We need multi-region by default** (e.g. for a global SaaS with strict latency SLOs). Currently, multi-region is a Pro/Ent paid add-on.
- **We adopt SQLite/Turso or another Edge-native DB.** Our DB is Postgres; switching to Turso would change the equation.

## Consequences

**Positive:**
- Full Node API access. All our dependencies work.
- Fluid Compute gives us edge-like concurrency benefits at lower cost.
- The Hono + Next.js + Better Auth + Drizzle stack is well-trodden on Node.
- Buyers with existing Vercel Pro accounts can deploy without changes.

**Negative:**
- Cold start is ~50-200ms, not sub-50ms. Acceptable for our use case but documented.
- Single region by default. Multi-region is a paid add-on.
- Bundle size monitoring is required. We document the strategy in [`../hosting.md`](../hosting.md).

**Neutral:**
- We could change runtime per route in a future iteration. The catch-all is in `apps/web/app/api/[[...route]]/route.ts`; a per-route split is one folder away.

## Implementation

- `apps/web/app/api/[[...route]]/route.ts` — Next.js default runtime is Node 20+. Explicit `export const runtime = 'nodejs'` for clarity (and to avoid any default change surprises in future Next.js versions).
- `vercel.json` — `"fluid": true`, `"functions."<path>": { "maxDuration": 800, "memory": 2048 }`.
- `packages/api` is **runtime-agnostic** — it doesn't import Vercel-specific code. The mount is in `apps/web`, which knows about Vercel.

## References

- [`../hosting.md`](../hosting.md) — the Vercel hosting details, Fluid Compute implications, bundle size
- [Vercel — Functions limits](https://vercel.com/docs/functions/limitations) — the official constraints
- [Vercel — Fluid compute](https://vercel.com/docs/fluid-compute) — the runtime model
- [Hono — Next.js integration](https://hono.dev/docs/getting-started/nextjs) — the mount pattern
- [Hono — Vercel integration](https://hono.dev/docs/getting-started/vercel) — Hono on Vercel
- [Vercel KB — Ship a Hono app on Vercel](https://vercel.com/kb/guide/ship-a-hono-app-on-vercel) — the canonical guide
- [Vercel — 30 min changelog (2026-06-15)](https://vercel.com/changelog/vercel-functions-can-now-run-up-to-30-minutes) — the changelog that bumped Node.js/Python + Fluid Compute GA from 800s to 1800s. Reflected in this ADR 2026-06-19.
