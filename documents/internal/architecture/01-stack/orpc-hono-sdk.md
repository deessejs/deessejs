# oRPC + Hono + OpenAPI + SDK + CLI

## Decision

**oRPC** for the internal RPC the web app uses to call the backend. **Hono** for the public REST API, mounted inside Next.js. **OpenAPI** as the contract surface between them. **Auto-generated TypeScript SDK** from the OpenAPI spec, consumed by the **CLI** (and by the buyer's own integrations).

This is treated as **one architectural decision** because the parts only work together as a unit. The "one source of truth" promise is the wedge; breaking it breaks four downstream surfaces.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Why one file, one decision

The pipeline looks like this:

```
oRPC contracts (internal) ──┐
                            ├──> OpenAPI spec ──> TS SDK ──> CLI
Hono routes (public) ───────┘
```

If we picked Hono alone (no oRPC), the web app would lose type safety end-to-end. If we picked oRPC alone (no Hono), the public REST API would have to be hand-written. If we didn't generate the SDK from OpenAPI, the SDK would drift from the API.

This is the **most novel piece** of the DeesseJS architecture. It deserves its own doc.

## What each piece does

### oRPC (internal RPC)

- The web app (`apps/template/apps/web/`) calls the backend via typed RPC.
- Endpoints defined in `apps/template/apps/web/lib/orpc/<feature>.ts`.
- Type safety end-to-end: no `any`, no hand-written types.
- Middleware: auth check, tenant scoping, rate limit, audit log.
- No HTTP boundary for the web app — it imports and calls functions directly.

### Hono (public REST API)

- Public REST API mounted inside Next.js at `/api/v1/[[...route]]/route.ts`.
- Hono handles routing, request validation, response shaping.
- Auth via API keys (Better Auth generated).
- Versioned: `/api/v1/...`, future `/api/v2/...`.
- Per-tenant rate limits and quotas.

### OpenAPI (the contract)

- Generated from both oRPC contracts and Hono routes.
- Single source of truth for the public API.
- Exposed at `/api/v1/openapi.json` for tooling (CLI, SDK, third-party integrations).

### TypeScript SDK (auto-generated)

- Generated from the OpenAPI spec (using `openapi-typescript` + a small codegen wrapper).
- Per-buyer: the buyer gets their own npm package for their API.
- Used by the CLI (`apps/template/apps/cli/`) to talk to the buyer's deployed service.
- Type-safe, tree-shakeable, retry/backoff built in.

### CLI (user-facing)

- The buyer's CLI, built with Commander + Bun.
- Consumes the SDK for all API calls.
- The user-facing commands (login, deploy, logs, init) are thin wrappers around SDK calls.

## Why this stack (not tRPC alone, not Hono alone, not Fastify)

| Alternative | Why not |
|---|---|
| **tRPC alone** | No public REST API. The buyer's CLI and third-party integrations would have to import from the buyer's internal code. |
| **Hono alone (no oRPC)** | Loses end-to-end type safety inside the web app. We'd hand-write types for every endpoint. |
| **Fastify + tRPC + custom SDK** | More moving parts. We lose the "single source of truth" because we hand-write the bridge. |
| **NestJS** | Heavy, opinionated, DI-heavy. Doesn't match our "delete what you don't need" modular contract. |
| **Express + Zod** | Lower-level, more glue code, no type safety on responses. |
| **Hasura / PostgREST** | Auto-generates REST from DB schema. Tight coupling to the DB, no business logic. |

oRPC + Hono wins because:

- **One source of truth** for the contract — the OpenAPI spec.
- **End-to-end type safety** inside the web app (oRPC) **and** in the SDK (auto-generated from OpenAPI).
- **Hono is lightweight** — no DI, no decorators, just routes.
- **Mounted in Next.js** — one deploy, not two. Matches our "single deploy per instance" principle.

## Conventions

- **One oRPC contract file per feature module**, in `apps/template/apps/web/lib/orpc/<feature>.ts`.
- **One Hono route file per feature module**, in `apps/template/apps/web/app/api/v1/<feature>/route.ts`.
- **The OpenAPI spec is generated** in CI and committed (or generated on every build — TBD per perf tradeoff).
- **SDK is generated** in CI and published to npm (or to the workspace registry during dev).
- **CLI commands are thin** — one `command.ts` file per command, importing from the SDK.

## Versioning

- **Public API**: `/api/v1/...`. Breaking changes require `/api/v2/...` (new ADR).
- **Internal RPC**: follows the template's SemVer. Breaking changes are allowed pre-1.0.
- **SDK**: follows the template's SemVer. The SDK is published with each template release.

## Failure modes and mitigations

| Failure | Mitigation |
|---|---|
| oRPC + Hono OpenAPI generation drift | CI runs contract tests (feature 23.6, 23.7). The OpenAPI spec is the source of truth; any drift fails the build. |
| SDK generation fails or produces broken types | CI builds the SDK before merging. If it fails, the PR fails. |
| Hono mounted in Next.js has edge cases | We use Node runtime for the API routes (not Edge). Edge is opt-in per route. |
| Buyer customizes the SDK and breaks it | The SDK is auto-regenerated on each release. Buyer customizations live in their own wrapper, not the SDK. |

## Cross-references

- [`../03-web-app/`](../03-web-app/) — the web app's architecture (where oRPC is consumed).
- [`../04-api-surface/`](../04-api-surface/) — the detailed architecture of this pipeline.
- [`../05-modular-contract/`](../05-modular-contract/) — how endpoints are split per feature module.
- [`../10-decisions/0003-hono-mounted-in-nextjs.md`](../10-decisions/) — the deploy model decision (when written).
- [`../../product/features/07-api.md`](../../product/features/07-api.md) — API feature inventory.
- [`../../product/features/08-sdk.md`](../../product/features/08-sdk.md) — SDK feature inventory.
- [`../../product/features/09-cli.md`](../../product/features/09-cli.md) — CLI feature inventory.
- [`./commander.md`](./commander.md) — the CLI library (consumes the SDK).
