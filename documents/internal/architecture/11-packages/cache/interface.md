# Interface — what `packages/cache` re-exports and adds

`packages/cache` is a thin **convention + test-isolation layer**
on top of `@upstash/redis`. It does NOT define its own `Cache`
interface — that would be re-inventing `@upstash/redis`. Instead it
provides:

1. **`createRedisClient()` factory** — picks the right backend
   (Upstash prod, in-memory tests)
2. **Memory client** — Upstash-compatible in-memory implementation
   for tests + local dev (no env vars needed)
3. **`key` builder** — typed, multi-tenant-aware key construction
4. **Convention enforcement** — raw string keys forbidden by ESLint

What consumers import:

```ts
import { createRedisClient, key, isMemoryClient } from '@deessejs/cache'
import type { Redis } from '@upstash/redis'  // re-exported for typing

const redis = createRedisClient()

// Use it like any Upstash Redis client
await redis.set(key.orgSession(orgId, token), JSON.stringify(session), { ex: 7 * 24 * 3600 })
const data = await redis.get<string>(key.orgSession(orgId, token))
```

## Why this shape (and not our own `Cache` interface)

We considered defining a 3-method `Cache` interface and wrapping Upstash
behind it. **We rejected this** — see `decisions/0001-why-now.md` §
"What we rejected". The short version:

- `@upstash/redis`'s API IS the 3-method interface. Re-implementing it
  is ceremony for ceremony's sake.
- The real value `packages/cache` adds is **NOT** the interface, it's:
  - The key builders (multi-tenant conventions)
  - The test-friendly client factory (memory in tests, Upstash in prod)
  - The future driver swap (one place to change)
- None of those require our own interface.

## What `packages/cache` exports

### `createRedisClient(): RedisLike`

Factory that returns an Upstash-compatible Redis client:

- **Production**: `@upstash/redis` REST client (when
  `UPSTASH_REDIS_REST_URL` is set)
- **Tests + local dev**: in-memory Upstash-compatible client
  (when the env var is absent)

```ts
import { createRedisClient } from '@deessejs/cache'
const redis = createRedisClient()
```

The return type is `RedisLike` — a structural type that captures the
subset of `@upstash/redis` we use. If a consumer needs other Upstash
methods, they `import type { Redis } from '@upstash/redis'`
(re-exported from `@deessejs/cache`).

### `MemoryRedisClient` (the test backend)

A pure in-memory implementation of the `RedisLike` subset. Same
methods, same return shapes, JSON-typed. Used:

- When `UPSTASH_REDIS_REST_URL` is not set (local dev, CI without
  secrets)
- In tests, via `createRedisClient({ force: 'memory' })`
- In ad-hoc scripts that want a Redis-compatible API without
  network

```ts
// tests/integration/foo.test.ts
import { createRedisClient } from '@deessejs/cache'
const redis = createRedisClient({ force: 'memory' })
```

### `key` (frozen object with builders)

```ts
import { key } from '@deessejs/cache'

// === Single-tenant (user-global) — auth package consumes ===
key.session(token)                         // → 'auth:session:abc-123'
key.otpCounter(identifier)                 // → 'auth:otp:user@example.com'
key.rateLimitIp(ip, path)                 // → 'auth:ratelimit:ip:1.2.3.4:/api/auth/sign-in/email'
key.apiKey(keyId)                         // → 'auth:apikey:ak_xyz'

// === Multi-tenant (tenant in the middle) — api package + future consumers ===
key.orgSession(orgId, token)              // → 'auth:session:org_org_123:abc-456'
key.orgApiKey(orgId, keyId)               // → 'auth:apikey:org_org_123:ak_xyz'
key.orgCache(orgId, entity, id)           // → 'org:cache:org_org_123:user:789'
key.orgRateLimit(orgId, ip, path)         // → 'api:ratelimit:org_org_123:ip_1.2.3.4:/api/v1/ping'
key.apiKeyRateLimit(keyId, path)          // → 'api:ratelimit:apikey_ak_xyz:/api/v1/users'

// Future (added when the first consumer appears):
// key.jobLock(name)                        // → 'jobs:lock:cron-send-digest'
// key.userPresence(orgId, userId)          // → 'rt:presence:org_org_123:user_user_456'
```

**Frozen** via `Object.freeze` so accidental mutation breaks (and is
caught by TypeScript's `readonly` types).

### `RedisLike` (structural type)

The subset of `@upstash/redis` we use. Defined structurally so we
don't re-export a class that needs to be instanceof-checked:

```ts
/**
 * The subset of @upstash/redis we consume. Captured as a structural
 * type so the MemoryRedisClient doesn't need to extend the real
 * @upstash/redis class (which would require a lot of mock surface).
 */
export interface RedisLike {
  get<T = unknown>(key: string): Promise<T | null>
  set<T>(key: string, value: T, opts?: { ex?: number }): Promise<'OK' | null>
  del(key: string): Promise<number>
  // Optional: the few other methods we use. Drivers can implement
  // what they support; consumers null-check.
  expire?(key: string, seconds: number): Promise<number>
  scan?(cursor: number, opts: { match: string; count?: number }): Promise<[number, string[]]>
  // For the GDPR purge helper:
  keys?(pattern: string): Promise<string[]>
}
```

**Why `RedisLike` instead of using `Redis` directly**: `@upstash/redis`'s
`Redis` class is concrete — our `MemoryRedisClient` can't extend it
without implementing dozens of unused methods. A structural interface
captures what we use, no more.

### `isMemoryClient(client)`

For tests that need to assert state (e.g. "did this code call
`redis.set`?"):

```ts
// tests/integration/secondary-storage.test.ts
import { isMemoryClient } from '@deessejs/cache'

afterEach(() => {
  if (isMemoryClient(redis)) redis.clear()  // type-narrowed
})
```

## What `packages/cache` does NOT export

Deliberately omitted. If you need them, import directly from
`@upstash/redis`:

- The full `Redis` class (we re-export the TYPE, not the class)
- Batch methods (`mget`, `mset`, `pipeline`) — add when a consumer
  needs them
- Pub/sub (`subscribe`, `publish`) — out of scope (separate
  package when needed)
- Streams (`xadd`, `xread`) — out of scope
- Queues (`lpush` / `brpop`) — out of scope

## TypeScript guarantees

- `createRedisClient()` returns `RedisLike`. Compile-time check
  prevents calling methods that aren't in our subset.
- `key` is `Readonly<typeof key>` — `key.session = ...` is a
  compile error.
- `isMemoryClient(client)` is a type guard. After the check, the
  variable is narrowed to `MemoryRedisClient` so you can call
  test-only methods like `clear()` or `size()`.

## Out of scope (still)

- Rate-limit atomic counters (`consume` / `INCR` + `EXPIRE`) — separate
  concern. `packages/api`'s rate-limit middleware uses `redis.get` +
  `redis.set` for now; if race conditions become a real issue, we
  add a `RateLimiter` interface or package later.
- pub/sub, queues, streams, locks — separate concerns, separate
  packages when needed.
- Distributed locks (the `SET NX` pattern) — we add a helper when the
  first use case appears.

## Example: full consumer pattern

```ts
// packages/auth/src/secondary-storage.ts
import { createRedisClient, key } from '@deessejs/cache'
import type { SecondaryStorage } from 'better-auth'

const redis = createRedisClient()

export const secondaryStorage: SecondaryStorage = {
  get: async (key: string) => {
    const value = await redis.get<string>(key)
    return value
  },
  set: async (key: string, value: string, ttl?: number) => {
    await redis.set(key, value, ttl ? { ex: ttl } : undefined)
  },
  delete: async (key: string) => {
    await redis.del(key)
  },
}
```

The whole file is ~10 lines. Better Auth's `secondaryStorage` shape
matches what Upstash gives us — no wrapping needed.