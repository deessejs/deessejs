# `04-api-surface/` — API surface (internal RPC + public REST + generated artifacts)

## Purpose

The full API stack — both **internal** (RPC the web app uses to talk to itself) and **external** (REST, SDK, and CLI exposed to the buyer's customers and end users). They are documented together because the architectural promise is **one source of truth**: oRPC contracts and Hono routes share types and validation, and the SDK and CLI are generated from that single source.

This folder covers:

- **Internal:** `orpc-internal.md` — the RPC the web app consumes. Never exposed outside the app.
- **External (public):** `hono-public.md` — the REST API the buyer's customers hit.
- **External (artifacts):** `sdk-generation.md` (npm package) and `cli-architecture.md` (binary shipped in the buyer's product).
- **Bridge:** `openapi-pipeline.md` — the contract generation that ties internal and external together.

If you're looking for "what does the buyer's customer touch", read the public + artifacts files. If you're looking for "how does the web app call the backend", read the internal file. The pipeline doc explains how they stay in sync.

This is the most architecturally novel part of the system. If the one-source-of-truth contract breaks, four downstream surfaces are affected.

## What's in here

- `README.md` (this file) — entry point and pipeline overview.
- `orpc-internal.md` — oRPC contracts, middleware (auth, tenant scope, rate limit), and how the web app consumes them.
- `hono-public.md` — the public REST API mounted in Next.js, route layout, versioning.
- `openapi-pipeline.md` — how the OpenAPI spec is generated, validated, and exposed.
- `sdk-generation.md` — auto-generated TypeScript SDK, per-buyer npm publish strategy.
- `cli-architecture.md` — the user-facing CLI (gh/vercel-style), how it consumes the SDK.

## Pipeline (the one source of truth)

```
oRPC contracts (internal) ──┐
                            ├──> OpenAPI spec ──> TS SDK ──> CLI
Hono routes (public) ───────┘
```

Both surfaces share type definitions and validation. The SDK and CLI are generated artifacts, never hand-written.

## Conventions

- All endpoints typed end-to-end: Drizzle → oRPC/Hono → SDK → CLI. No `any`. No hand-maintained mirror types.
- Every public endpoint has: an OpenAPI description, a rate-limit policy, a per-tenant quota, and an audit log entry.
- API key auth for the public API. Session auth for the internal RPC.
- Versioning: `/api/v1/...`. New major versions require a new ADRs entry in `10-decisions/`.
- Breaking changes: never on a minor. Deprecate, then remove on a major.

## Related

- [`01-stack/orpc-hono-sdk.md`](../01-stack/orpc-hono-sdk.md) — the unified rationale doc.
- [`05-modular-contract/`](../05-modular-contract/) — how API routes are split per feature module.
- [`../product/features/07-api.md`](../../product/features/07-api.md) — feature inventory.
- [`../product/features/08-sdk.md`](../../product/features/08-sdk.md) — SDK spec.
- [`../product/features/09-cli.md`](../../product/features/09-cli.md) — CLI spec.
- [`10-decisions/0003-hono-mounted-in-nextjs.md`](../10-decisions/0003-hono-mounted-in-nextjs.md) — the deploy model decision.
