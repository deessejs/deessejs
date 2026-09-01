# @workspace/api

## 0.0.3

### Patch Changes

- ba74f0c: Hardens the wire error contract for the `templates.list` oRPC procedure, in support of issue #81 on the marketing site.

  - `packages/api/src/orpc/routes/templates.ts` now declares the wire-code via `.errors({ TEMPLATES_FETCH_FAILED: ... })` and translates any throw from `enrich()` into `ORPCError("TEMPLATES_FETCH_FAILED", { status: 502 })`. The HTTP status is 502 (Bad Gateway — GitHub is the upstream dependency), not 503 as previously documented. Clients used to the documented 503 should treat any non-2xx as retriable; the status code is informational. The typed client can now branch on `err instanceof ORPCError && err.code === "TEMPLATES_FETCH_FAILED"` to render an "upstream registry unavailable" state distinct from a generic 500.
  - `packages/api/src/http/mount-rpc.ts` now sets `Cache-Control: no-store` on every response from `/rpc/*`. RPC responses are user-/session-derived and time-sensitive; a CDN/proxy in front of the API must not cache them. The header is independent of any route-level fetch cache the client opts into via Next.js ISR directives on `fetch`.
  - `packages/api/src/core/templates/enrich.ts` JSDoc is updated to match the implementation: `enrich()` is intentionally low-level and surfaces raw `Error` instances. Translation to `TEMPLATES_FETCH_FAILED` lives one layer up in the handler — keeping the core layer pure makes both layers individually testable and prevents the wire-code from leaking into the registry.
  - `packages/api/tests/integration/rpc/templates.test.ts` adds a unit-style block that pins this contract: `enrich()` rejects with a plain `Error` when GitHub returns non-OK, and does not translate errors itself.

  No consumer of the templates procedure is required to update. The marketing-site change in PR #85 reads the wire-code through `error.tsx` and the `error.digest` only; the typed client API surface is unchanged.

- Updated dependencies [8bc8916]
- Updated dependencies [ac69a68]
- Updated dependencies [af040af]
  - @workspace/auth@0.1.0
  - @workspace/env@0.0.1
  - @workspace/database@0.0.2

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1
  - @workspace/auth@0.0.2

## 0.0.1

### Patch Changes

- 28f8e6f: fix(api): `/ready` endpoint now pings Postgres before returning 200. The previous handler wrapped `c.json()` in a try/catch, but `c.json()` never throws — it just builds a Response — so the endpoint always returned `{ status: "ready" }`, giving Kubernetes and load balancers a false ready signal when the database was unreachable. Replaced with `await db.execute(sql\`SELECT 1\`)`; connection failures (ECONNREFUSED, ETIMEDOUT, pool exhaustion) now correctly return 503.
- Updated dependencies [03712ca]
  - @workspace/auth@0.0.1
