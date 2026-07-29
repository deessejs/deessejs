# Client — `createRedisClient()` factory + memory backend

`packages/cache` exposes ONE function: `createRedisClient()`. It returns
an Upstash-compatible Redis client. In production it's `@upstash/redis`;
in tests + local dev it's an in-memory implementation with the same API.

## Why no "driver" abstraction

We considered a `CacheDriver` interface (à la Keyv) with multiple
implementations (`UpstashDriver`, `MemoryDriver`, future
`RedisTcpDriver`). We **rejected this** because:

- The driver API IS the Upstash API. There's nothing to abstract.
- A driver interface would mean re-implementing `get`/`set`/`del`/
  `expire`/`scan`/`keys`/`pipeline` etc. for every driver.
- `@upstash/redis` already works in dev (test mode) via the `local`
  option, but that's an extra dep and slower than our in-memory
  client.

The factory + structural `RedisLike` interface is enough. We get test
isolation (memory) and driver swap (just change the factory) without
the boilerplate.

## `createRedisClient()`

```ts
// packages/cache/src/client.ts (illustrative)
import { Redis as UpstashRedis } from '@upstash/redis'
import { MemoryRedisClient } from './memory-client'
import type { RedisLike } from './types'

export interface CreateRedisClientOptions {
  /**
   * Force a specific backend. Defaults to:
   *   - 'upstash' if UPSTASH_REDIS_REST_URL is set
   *   - 'memory' otherwise (dev, tests, local)
   */
  force?: 'memory' | 'upstash'
}

export function createRedisClient(
  opts: CreateRedisClientOptions = {},
): RedisLike {
  if (opts.force === 'memory') return new MemoryRedisClient()
  if (opts.force === 'upstash') return makeUpstashClient()

  // Auto-detect
  if (process.env.UPSTASH_REDIS_REST_URL) return makeUpstashClient()
  return new MemoryRedisClient()
}

function makeUpstashClient(): RedisLike {
  return new UpstashRedis({
    url: process.env.UPSTASH_REDIS_REST_URL!,
    token: process.env.UPSTASH_REDIS_REST_TOKEN!,
  }) as unknown as RedisLike
}
```

## Memory backend

```ts
// packages/cache/src/memory-client.ts (illustrative)
import type { RedisLike } from './types'

/**
 * In-memory Upstash-compatible Redis client. JSON-native values.
 * Used in tests + local dev when no Upstash credentials are set.
 */
export class MemoryRedisClient implements RedisLike {
  private store = new Map<string, string>()
  private expiresAt = new Map<string, number>()

  async get<T = unknown>(key: string): Promise<T | null> {
    if (this.isExpired(key)) {
      this.store.delete(key)
      this.expiresAt.delete(key)
      return null
    }
    const raw = this.store.get(key)
    return raw === undefined ? null : (JSON.parse(raw) as T)
  }

  async set<T>(
    key: string,
    value: T,
    opts?: { ex?: number },
  ): Promise<'OK' | null> {
    this.store.set(key, JSON.stringify(value))
    if (opts?.ex) {
      this.expiresAt.set(key, Date.now() + opts.ex * 1000)
    } else {
      this.expiresAt.delete(key)
    }
    return 'OK'
  }

  async del(key: string): Promise<number> {
    const had = this.store.delete(key)
    this.expiresAt.delete(key)
    return had ? 1 : 0
  }

  async expire(key: string, seconds: number): Promise<number> {
    if (!this.store.has(key)) return 0
    this.expiresAt.set(key, Date.now() + seconds * 1000)
    return 1
  }

  async scan(
    cursor: number,
    opts: { match: string; count?: number },
  ): Promise<[number, string[]]> {
    const matches: string[] = []
    const regex = globToRegex(opts.match)
    for (const key of this.store.keys()) {
      if (regex.test(key)) matches.push(key)
    }
    return [0, matches]  // simplified — no cursor for in-memory
  }

  async keys(pattern: string): Promise<string[]> {
    const [, keys] = await this.scan(0, { match: pattern })
    return keys
  }

  private isExpired(key: string): boolean {
    const expiresAt = this.expiresAt.get(key)
    return expiresAt !== undefined && Date.now() >= expiresAt
  }

  /** Test-only. Clears all stored keys. */
  clear(): void {
    this.store.clear()
    this.expiresAt.clear()
  }

  /** Test-only. Returns the number of stored keys. */
  size(): number {
    return this.store.size
  }
}
```

## `isMemoryClient(client)` helper

```ts
// packages/cache/src/index.ts
export function isMemoryClient(client: RedisLike): client is MemoryRedisClient {
  return client instanceof MemoryRedisClient
}
```

Used in tests to assert state without reaching for `@internal` flags:

```ts
// tests/integration/secondary-storage.test.ts
import { createRedisClient, isMemoryClient } from '@deessejs/cache'

describe('secondaryStorage', () => {
  let redis = createRedisClient({ force: 'memory' })

  afterEach(() => {
    if (isMemoryClient(redis)) redis.clear()
  })

  it('round-trips a session', async () => {
    await secondaryStorage.set(key.session('abc'), 'serialized', 3600)
    expect(await secondaryStorage.get(key.session('abc'))).toBe('serialized')
  })
})
```

## Future drivers

When we need to swap (e.g. self-hosted Redis TCP for cost, Cloudflare
KV for a CF Workers deployment), we add a new client class
implementing `RedisLike` and a new branch in `createRedisClient()`:

```ts
// Future
export class RedisTcpClient implements RedisLike { ... }
export class CloudflareKvClient implements RedisLike { ... }

export function createRedisClient(opts) {
  if (opts.force === 'memory') return new MemoryRedisClient()
  if (opts.force === 'redis-tcp') return new RedisTcpClient(...)
  // ... etc
}
```

No consumer code changes. The structural `RedisLike` interface is the
contract.

## Why we kept the `MemoryRedisClient` as a class (not a function)

Two reasons:
- It has **test-only methods** (`clear()`, `size()`) that we don't
  want on the `RedisLike` interface. A class lets us expose them
  without polluting the public contract.
- It carries **mutable state** (the `Map`). A function returning a
  fresh object each call would lose that state. A class encapsulates
  it.

Same pattern we use elsewhere in the monorepo: **class = state, function = stateless**.

## Tiered stores (memory L1 + Upstash L2)?

We considered this (cache-manager / RedisX pattern). **Rejected** for v1:

- Adds complexity (two layers to reason about)
- Requires write amplification (every set hits both layers)
- Doesn't pay off until we have a hot-data pattern, which we don't
- If we add it later, it's a TieredRedisClient class that wraps two
  `RedisLike` instances — doesn't change the consumer API

YAGNI. If profiling shows a hot-data pattern, we add it then.

## Testing

```ts
// packages/cache/tests/client.test.ts
describe('createRedisClient', () => {
  it('returns MemoryRedisClient in test env (no Upstash env)', () => {
    delete process.env.UPSTASH_REDIS_REST_URL
    const client = createRedisClient()
    expect(isMemoryClient(client)).toBe(true)
  })

  it('honors { force: "memory" }', () => {
    const client = createRedisClient({ force: 'memory' })
    expect(isMemoryClient(client)).toBe(true)
  })
})

describe('MemoryRedisClient', () => {
  let redis: MemoryRedisClient

  beforeEach(() => {
    redis = new MemoryRedisClient()
  })

  it('round-trips JSON values', async () => {
    await redis.set('k', { hello: 'world' })
    expect(await redis.get('k')).toEqual({ hello: 'world' })
  })

  it('respects ex TTL', async () => {
    await redis.set('k', 'v', { ex: 1 })
    expect(await redis.get('k')).toBe('v')
    await new Promise(r => setTimeout(r, 1100))
    expect(await redis.get('k')).toBeNull()
  })

  it('del returns 1 for existing key, 0 for missing', async () => {
    await redis.set('k', 'v')
    expect(await redis.del('k')).toBe(1)
    expect(await redis.del('k')).toBe(0)
  })

  it('keys() matches glob pattern', async () => {
    await redis.set('auth:session:a', '1')
    await redis.set('auth:session:b', '2')
    await redis.set('api:cache:x', '3')
    expect((await redis.keys('auth:session:*')).sort()).toEqual([
      'auth:session:a',
      'auth:session:b',
    ])
  })
})
```