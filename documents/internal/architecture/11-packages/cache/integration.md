# Integration — how consumers use `packages/cache`

Code-level patterns for the first two consumers. Future consumers
(future workers, events) follow the same shape.

## Pattern (universal)

```ts
import { createRedisClient, key } from '@deessejs/cache'

const redis = createRedisClient()

// Use like any Upstash Redis client — no wrapping
await redis.set(key.orgSession(orgId, token), JSON.stringify(session), { ex: 7 * 24 * 3600 })
const data = await redis.get<string>(key.orgSession(orgId, token))
```

That's it. No `Cache` interface. No `TieredCache`. No drivers.
Just an Upstash-compatible client and typed key builders.

## Consumer 1: `packages/auth` (Better Auth `secondaryStorage`)

Better Auth accepts a `secondaryStorage` object with `get`/`set`/`delete`
methods. We bridge from Upstash to Better Auth's expected shape. ~10
lines.

```ts
// packages/auth/src/secondary-storage.ts
import { createRedisClient, key } from '@deessejs/cache'
import type { SecondaryStorage } from 'better-auth'

const redis = createRedisClient()

export const secondaryStorage: SecondaryStorage = {
  get: async (k: string) => {
    // Better Auth reads back what it stored (string).
    const value = await redis.get<string>(k)
    return value
  },
  set: async (k: string, value: string, ttl?: number) => {
    await redis.set(k, value, ttl ? { ex: ttl } : undefined)
  },
  delete: async (k: string) => {
    await redis.del(k)
  },
}
```

Then in `auth.ts`:

```ts
import { secondaryStorage } from './secondary-storage'

export const auth = betterAuth({
  // ...
  secondaryStorage,
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      // ...
    },
  },
})
```

**Better Auth key naming** (used internally, no translation needed):
- `auth:session:{token}` — session cache
- `auth:otp:{identifier}` — OTP attempt counter
- `auth:ratelimit:ip:{ip}:{path}` — built-in rate limit

These already follow `{domain}:{entity}:{id}`. Domain is `auth`.
They match our key builder conventions exactly.

### What we DON'T translate

Better Auth's built-in rate limiter uses the secondary storage via
get/set (NOT atomic consume). This is fine for sequential rate
limiting — see `M0-deferred-work.md` §2 for the analysis.

If we later add `consume` to Upstash or add a `RateLimiter` package,
Better Auth won't benefit automatically — we'd need to write a
custom rate-limit strategy. Defer that until profiling shows
concurrent races are a real issue.

## Consumer 2: `packages/api` (rate limit middleware)

The api package's `rateLimitMiddleware` currently passes through
(no-op). In Sprint 1.5, we wire it to the cache.

```ts
// packages/api/src/middlewares/hono/rate-limit.ts
import { createRedisClient, key } from '@deessejs/cache'

const redis = createRedisClient()

export const rateLimitMiddleware: MiddlewareHandler = async (c, next) => {
  const path = c.req.path
  const ip = c.req.header('cf-connecting-ip')
    ?? c.req.header('x-forwarded-for')
    ?? 'unknown'

  // Use the rate-limit key builder (tenant if available, else IP)
  const orgId = c.get('authContext') ? /* resolve from session */ null : null
  const rateKey = orgId
    ? key.orgRateLimit(orgId, ip, path)
    : key.rateLimitIp(ip, path)

  // Get current count. Catches Redis errors → fall through as if cache miss.
  let data: { count: number; lastRequest: number } | null = null
  try {
    data = await redis.get<{ count: number; lastRequest: number }>(rateKey)
  } catch (err) {
    // Fail-open for cache reads (treat as miss). The rate-limit policy
    // is fail-closed: if we can't read the counter, we DENY the
    // request. Tweak this if monitoring shows too many false positives.
    log.warn({ err, rateKey }, 'rate-limit read failed; denying request')
    return c.json({ code: 'rate_limited', message: 'Try again later' }, 429)
  }

  const now = Date.now()
  const windowMs = 60 * 1000
  const max = 100

  if (!data) {
    // First request in this window. Set the counter.
    await redis.set(rateKey, JSON.stringify({ count: 1, lastRequest: now }), { ex: 60 })
    return next()
  }

  if (now - data.lastRequest < windowMs && data.count >= max) {
    return c.json({ code: 'rate_limited', message: 'Too many requests' }, 429, {
      'Retry-After': String(Math.ceil((data.lastRequest + windowMs - now) / 1000)),
    })
  }

  // Reset or increment
  const newCount = now - data.lastRequest > windowMs ? 1 : data.count + 1
  await redis.set(rateKey, JSON.stringify({ count: newCount, lastRequest: now }), { ex: 60 })

  return next()
}
```

This replaces the current `rateLimitMiddleware` stub.

### Sequential vs concurrent correctness

With `get` + `set` (no atomic `consume`), two concurrent requests can
both read `count: 4` and both write `count: 5` — letting one extra
request through per window under high concurrency.

For v1 we accept this. If monitoring shows a real race-condition
leak, we add a `RateLimiter` package — see `decisions/0001-why-now.md`
§ "What we rejected".

## Consumer 3: future worker / events (Sprint 2+)

The pattern is the same: import `createRedisClient` + `key`, use the
Upstash client. Each new consumer adds its own keys to the `key`
builder in `packages/cache`.

Example for a future `packages/worker`:

```ts
import { createRedisClient, key } from '@deessejs/cache'

const redis = createRedisClient()

// Lock for a cron job that must not run concurrently across instances
async function tryAcquireLock(name: string, ttlSec: number): Promise<boolean> {
  const result = await redis.set(key.jobLock(name), '1', { ex: ttlSec, nx: true })
  // Upstash returns 'OK' on first set, null if key already exists
  return result === 'OK'
}
```

We add `key.jobLock(name)` to the builder when we add the first
consumer. NOT before.

## Migration from current state

When `packages/cache` is implemented:

1. **`packages/auth/src/redis.ts`** (to be created for `secondaryStorage`)
   is replaced by `packages/auth/src/secondary-storage.ts` using
   `createRedisClient()`. The Upstash init moves to the cache package.

2. **`packages/api/src/middlewares/hono/rate-limit.ts`** gets real
   logic instead of the warn-only stub.

3. **No other package changes.** Database, web app, etc. don't
   consume the cache yet.

4. **ESLint rule** added to ban direct `@upstash/redis` imports outside
   `packages/cache/src/`. Forces future consumers to go through
   `packages/cache`.

## Test patterns

```ts
// packages/auth/tests/integration/secondary-storage.test.ts
import { createRedisClient, isMemoryClient, key } from '@deessejs/cache'
import { secondaryStorage } from '../../src/secondary-storage'

describe('secondaryStorage', () => {
  let redis = createRedisClient({ force: 'memory' })

  afterEach(() => {
    if (isMemoryClient(redis)) redis.clear()
  })

  it('returns null on miss', async () => {
    expect(await secondaryStorage.get(key.session('missing'))).toBeNull()
  })

  it('round-trips a value', async () => {
    await secondaryStorage.set(key.session('abc'), 'serialized')
    expect(await secondaryStorage.get(key.session('abc'))).toBe('serialized')
  })

  it('respects TTL', async () => {
    await secondaryStorage.set(key.session('abc'), 'value', 1)
    await new Promise(r => setTimeout(r, 1100))
    expect(await secondaryStorage.get(key.session('abc'))).toBeNull()
  })
})
```

The memory client is used in unit tests for fast, deterministic
behavior. No Upstash credentials needed in CI.

## What this integration does NOT cover (deliberately)

- **Pub/sub**: out of scope. When we add it (Sprint 3+), it'll be a
  separate concern, possibly a separate package.
- **Job queues**: out of scope. Use BullMQ or QStash directly.
- **Streams**: out of scope.
- **Distributed locks**: we add a helper when the first use case
  appears. Not before.

`packages/cache` stays focused on the cache + key-value primitive.
Other Redis patterns get their own packages when they emerge.