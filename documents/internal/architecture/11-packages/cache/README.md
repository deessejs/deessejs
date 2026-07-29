# `packages/cache`

A thin convention + test-isolation layer on top of `@upstash/redis`.
It does NOT define its own cache interface — `@upstash/redis`'s API
IS the cache interface. What `packages/cache` adds:

- **`createRedisClient()`** — auto-detects Upstash vs in-memory
- **`MemoryRedisClient`** — Upstash-compatible in-memory backend for
  tests + local dev (no env vars needed)
- **`key` builder** — typed, multi-tenant-aware key construction
- **Convention enforcement** — raw string keys forbidden by ESLint

## Purpose

By M5, **6 different packages** will read or write a Redis-compatible
KV store (Upstash in prod, in-memory in tests):

- `packages/auth` — Better Auth `secondaryStorage` (session cache, rate
  limit, OTP counters, API key cache)
- `packages/api` — rate-limit middleware, API key lookup, response cache
- `apps/web` (future) — server-component fetch cache, ISR cache
- `apps/cloud` (future) — cross-instance pub/sub, distributed locks
- Background workers (Sprint 2+) — BullMQ / Upstash QStash queues
- Real-time layer (Sprint 3+) — presence, collaborative editing

If each of these inits its own `@upstash/redis` client, we get
**divergent key naming**, **inconsistent error handling**, **no
central observability**, and **N different test mocks**. `packages/cache`
exists to prevent all of that — by giving everyone the same client
factory + the same key conventions.

## Scope

What `packages/cache` IS:

- The single `createRedisClient()` factory (env → Upstash or memory)
- The `RedisLike` structural type (subset of `@upstash/redis` we use)
- The in-memory `MemoryRedisClient` for tests + local dev
- Key naming conventions and a `key` builder (`key.session(...)`, etc.)
- Multi-tenant key format (`key.orgSession(orgId, token)`)
- ESLint rule banning direct `@upstash/redis` imports outside
  `packages/cache/src/`

What `packages/cache` is NOT:

- A Redis client library (it depends on `@upstash/redis`)
- A custom cache interface (we re-use `@upstash/redis`'s)
- A pub/sub abstraction (out of scope; use `@upstash/realtime` directly)
- A job queue (out of scope; use BullMQ / QStash directly)
- A distributed lock (out of scope; use Redis SETNX directly when needed)

## Why now (and not "later when we have 2 consumers")

Because the user (founder) prefers no breaking changes. The cost of
NOT having `packages/cache` now:

- Sprint 1.5: `packages/api` needs Redis for rate limiting → inits its
  own client → **breaking change** when we extract `packages/cache`
- Sprint 2: workers need Redis → inits another client → another
  breaking change
- Sprint 3: pub/sub needs Redis → yet another client → ANOTHER
  breaking change

Each "extract later" is a breaking change for the consumers of
`packages/auth` (or whoever hosts Redis first). By creating
`packages/cache` before the first non-auth consumer, we have **one
breaking change** instead of **three**.

The YAGNI counter-argument ("wait for 2 consumers") doesn't apply
because the 2nd consumer is known and planned (Sprint 1.5). We're
not waiting for a hypothetical future need.

## Why "thin wrapper around Upstash" and not "custom Cache interface"

We considered defining our own 3-method `Cache` interface and wrapping
Upstash behind it. **We rejected this** because:

- `@upstash/redis`'s API IS the 3-method interface. Re-implementing
  it is ceremony for ceremony's sake.
- The real value `packages/cache` adds is **NOT** the interface, it's:
  - The key builders (multi-tenant conventions)
  - The test-friendly client factory (memory in tests)
  - The future driver swap (one place to change)
- None of those require our own interface.

See [`decisions/0001-why-now.md`](./decisions/0001-why-now.md) §
"What we rejected" for the full analysis (compared against Keyv,
cache-manager, RedisX, OneUptime).

## Versioning

Same as the rest of the monorepo — `0.0.0`, private, consumed via
`workspace:*`. No semver until we publish externally (we won't).

## Surface

```ts
// Public exports from `@deessejs/cache`:
export function createRedisClient(opts?: { force?: 'memory' | 'upstash' }): RedisLike
export function isMemoryClient(client: RedisLike): client is MemoryRedisClient

export const key: Readonly<{
  // Single-tenant (user-global) — auth package consumes
  session: (token: string) => string
  otpCounter: (identifier: string) => string
  rateLimitIp: (ip: string, path: string) => string
  apiKey: (keyId: string) => string

  // Multi-tenant (tenant in the middle) — api package + future consumers
  orgSession: (orgId: string, token: string) => string
  orgApiKey: (orgId: string, keyId: string) => string
  orgCache: (orgId: string, entity: string, id: string) => string
  orgRateLimit: (orgId: string, ip: string, path: string) => string
  apiKeyRateLimit: (keyId: string, path: string) => string
}>

export type { Redis } from '@upstash/redis'  // re-exported for typing

// Test backend (not normally used by app code)
export class MemoryRedisClient implements RedisLike { ... }
```

**Full contract**: see [`interface.md`](./interface.md).

**Client factory + memory backend**: see [`client.md`](./client.md).

**Key naming + multi-tenant + error policy**: see [`conventions.md`](./conventions.md).

**How consumers use it**: see [`integration.md`](./integration.md).

## Cross-references

- [`../auth/`](../../auth/) — first consumer (Better Auth `secondaryStorage`)
- [`../api/`](../../api/) — second consumer (rate limit middleware, Sprint 1.5)
- [`../database/`](../../database/) — does NOT consume this package
  (Postgres handles its own caching via Drizzle query log + connection pool)
- [`../auth/M0-deferred-work.md`](../../auth/M0-deferred-work.md) — lists
  this package as the home for the Upstash init

## Conventions (enforced)

- **All cache keys flow through the `key` builder**. No raw string
  keys. ESLint regex check enforces this.
- **Multi-tenant data MUST use the `org*` builders**. Org-scoped data
  is `orgId`-prefixed to prevent cross-tenant leakage.
- **Tests use the memory backend** by default. No env vars, no Redis
  dependency, deterministic across runs.
- **Producers handle cache failures at the call site** (try/catch).
  Cache is best-effort; rate limit is fail-closed. Each consumer
  picks its own policy.
- **No direct `@upstash/redis` imports outside this package**.
  ESLint rule (added in this package's `eslint.config.js`) bans
  `@upstash/redis` in `packages/*/src/**` except `packages/cache/src/`.