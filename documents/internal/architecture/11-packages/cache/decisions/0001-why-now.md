# 0001. `packages/cache` — thin Upstash wrapper in M0 (not "later")

- **Status:** Accepted
- **Date:** 2026-06-22
- **Deciders:** founder, tech lead
- **Scope:** new package at `apps/template/packages/cache/`, new doc
  folder at `documents/internal/architecture/11-packages/cache/`

## Context

Multiple packages will read/write a Redis-compatible KV store over the
lifetime of the template. Known consumers:

| Sprint | Consumer | Use case |
|---|---|---|
| Sprint 1 | `packages/auth` | Better Auth `secondaryStorage` (session, rate limit, OTP, API key cache) |
| Sprint 1.5 | `packages/api` | Rate-limit middleware, API key lookup cache |
| Sprint 2+ | workers (future) | BullMQ / QStash queue, distributed locks for cron |
| Sprint 3+ | real-time layer (future) | pub/sub for collaborative editing, presence |
| Sprint 4+ | apps/cloud (future) | multi-region session sync, org cache, distributed locks |

The YAGNI counter-argument says: "wait until you have 2 concrete
consumers, then extract." Applied here: wait until Sprint 1.5, extract
when `packages/api` also needs Redis.

## Why we reject YAGNI for this case

Three reasons override the "wait for 2 consumers" rule:

1. **The 2nd consumer is planned, not speculative.** We know Sprint
   1.5 will need Redis for rate limiting. We're not waiting for a
   hypothetical future need — we're deferring 2-3 weeks of inevitable
   work. The "wait for 2 consumers" rule applies to uncertain futures,
   not to planned ones.

2. **Breaking changes are worse than premature abstraction.** If
   `packages/auth` inits Redis directly today, then `packages/api`
   also inits Redis directly in Sprint 1.5, and then we extract
   `packages/cache` in Sprint 2 — we have 2 separate migrations and
   2 consumers whose internals need to be touched. By extracting
   `packages/cache` in M0 (before `packages/auth` writes its first
   Redis init), we have **1 migration, 0 consumers touched**.

3. **The user (founder) prefers no breaking changes.** Captured
   during this session — the cost of breaking changes to consumers
   is weighted higher than the cost of an extra package in the
   monorepo at M0.

## The design decision (revised mid-session)

**Initial draft** proposed a custom 3-method `Cache` interface with
`CacheDriver` implementations (Keyv-style). **We rejected this**
after cross-checking with senior Node.js cache libraries.

The actual design is a **thin Upstash-direct wrapper**:

- No custom `Cache` interface. We re-use `@upstash/redis`'s API.
- `createRedisClient()` returns Upstash in prod, `MemoryRedisClient`
  in tests.
- The `key` builder enforces multi-tenant key conventions.
- That's it. ~80 LOC instead of ~200.

### Why we rejected our own Cache interface

We initially proposed:
```ts
// Rejected
interface Cache {
  get<T>(key: string): Promise<T | null>
  set<T>(key: string, value: T, opts?: { ttl?: number }): Promise<void>
  delete(key: string): Promise<void>
  consume?(...): Promise<...>  // atomic rate limit
}
```

The founder pushed back: **"pourquoi est-ce qu'on crée notre propre
interface de cache si on a upstash redis ?"** — a real senior
challenge. After cross-checking against senior prod patterns, we
agreed:

- `@upstash/redis`'s API IS the 3-method interface. Re-implementing
  it is ceremony for ceremony's sake.
- `consume` doesn't belong on the cache interface. Rate limiting
  is a separate concern.
- Tiered stores (memory L1 + Redis L2) add complexity we don't
  need at v1.

## Considered options

### Option 1 — `packages/cache` as a thin Upstash wrapper (chosen)

- Pros: minimal abstraction, 1 migration forever, no breaking
  changes later. Key conventions + test isolation come for free.
  Re-uses the battle-tested `@upstash/redis` library.
- Cons: 1 extra package in the monorepo at M0 with only 1
  consumer. If the cache usage pattern is wildly different from
  Upstash's API, we'll need to add a thin shim layer later.

### Option 2 — Custom `Cache` interface (the initial draft, rejected)

- Pros: type-level abstraction over the storage backend.
- Cons: re-implements `@upstash/redis`'s API. Tests confirmed no
  value vs Upstash direct. Adds 3 classes (`TieredCache`,
  `MemoryCache`, `UpstashCache`) for no functional benefit.

### Option 3 — Use `@upstash/redis` directly, no shared package

- Pros: 0 new abstraction. Minimal LOC.
- Cons: each package inits its own client. Key conventions are
  enforced only by code review. Test isolation requires mocking
  `@upstash/redis` everywhere (or the same memory client duplicated
  per package). Driver swap = touching every consumer. The cost of
  the duplicate `redis = new Redis({...})` is small per package but
  compounds.

### Option 4 — Vendor or depend on Keyv

- Pros: battle-tested cache library with adapters.
- Cons: Keyv is a generic KV. We need domain-typed key builders
  + multi-tenant conventions + env-driven client selection. Building
  those on top of Keyv is ~same LOC as our wrapper but with an extra
  indirection layer.

  **Keep Keyv as a future option** — if the package grows past
  ~500 LOC or we need pub/sub / queues, switch to Keyv under the
  hood.

## Decision

**Create `packages/cache` in M0 as a thin Upstash wrapper, with:**

- `createRedisClient()` factory (env → Upstash or memory)
- `MemoryRedisClient` (in-memory Upstash-compatible backend for tests)
- `key` builder (typed, multi-tenant, frozen)
- `RedisLike` structural type (the subset of `@upstash/redis` we use)
- ESLint rule banning direct `@upstash/redis` imports outside
  `packages/cache/src/`

**Explicitly NOT included** (deferred until first use case):

- `consume` (atomic rate-limit) — separate concern, separate package
  later. Rate limit for v1 uses `get` + `set` with the known
  race-condition limitation.
- Tiered stores — YAGNI for v1. If profiling shows a hot-data
  pattern, add a `TieredRedisClient` class that wraps two `RedisLike`
  instances.
- pub/sub, queues, streams, locks — out of scope entirely.

## Why this matches senior prod patterns

Validated against:

- [Keyv](https://keyv.org/docs/keyv/) — we rejected their 3-method
  cache interface but kept their driver pattern (re-implementable
  in `createRedisClient`)
- [cache-manager / Cacheable](https://cacheable.org/docs/cache-manager/)
  — we considered their tiered-store pattern but rejected for v1
- [NestJS RedisX](https://nestjs-redisx.dev/en/guide/architecture/key-naming)
  — kept their `{service}:{entity}:{id}` key format with tenant in
  the middle
- [OneUptime multi-tenant Redis guide (2026-03)](https://oneuptime.com/blog/post/2026-03-31-redis-how-to-implement-multi-tenancy-with-redis-key-prefixes/view)
  — same tenant-prefix logic; we use RedisX's "tenant in middle"
  variant instead of OneUptime's "tenant at start" for observability
- [Upstash + Better Auth blog](https://upstash.com/blog/better-auth-with-redis)
  — same Upstash pattern we follow, with the env-driven client
  selection

What we REJECTED from these sources:

- Keyv's `consume`-equivalent on the cache interface — wrong
  abstraction (rate limit is not a cache concern)
- Keyv's `namespace` option — replaced by our typed `key` builder
  (compile-time safety, not string concatenation)
- cache-manager's tiered stores — YAGNI for v1
- OneUptime's `tenant:` prefix at the start — we put tenant in the
  middle (RedisX convention) so package-level visibility is preserved
  in `redis-cli MONITOR`

## Consequences

**Positive:**

- No breaking change ever for Redis-using consumers. Adding a new
  consumer is a pure addition (a new key builder + import).
- Key naming + multi-tenant isolation conventions enforced from day 1.
- Tests are deterministic (memory client, no env needed).
- ESLint bans `@upstash/redis` direct imports outside
  `packages/cache/src/` — forces all consumers through the package.
- ~80 LOC of new code (vs ~200 for the rejected interface design).

**Negative:**

- 1 extra package in the monorepo at M0 (with 1 consumer).
- We re-export `Redis` from `@upstash/redis` (one dep transitively
  pulled into every consumer). This is acceptable: `@upstash/redis`
  is small (~20KB gzipped) and is the actual runtime backend.
- `consume` is not on the interface, so rate-limit consumers use
  `get` + `set` (race-condition limitation accepted for v1). If
  profiling shows this is a real problem, we add a `RateLimiter`
  package later.

**Neutral:**

- ESLint complexity grows by 1 file (the cache package's
  `eslint.config.js`).
- Memory note: `packages/cache` is the home for ALL Redis init in
  the monorepo (see tech-lead memory).

## Implementation order

1. Create `apps/template/packages/cache/` skeleton: package.json,
   tsconfig.json, eslint.config.js, src/index.ts (re-exports).
2. Implement `key` builder + `RedisLike` type.
3. Implement `MemoryRedisClient` + tests.
4. Implement `createRedisClient()` factory + tests.
5. Wire `packages/auth` `secondaryStorage` to use it. Remove the
   placeholder Upstash init.
6. Wire `packages/api` rate-limit middleware to use it.
7. Add ESLint rule banning direct `@upstash/redis` imports outside
   `packages/cache/src/`.
8. Update the README + cross-references in adjacent packages.

Estimated: 1 day of focused work.

## References

- [`../README.md`](../README.md) — package overview, scope
- [`../interface.md`](../interface.md) — the public contract
- [`../client.md`](../client.md) — `createRedisClient()` + memory backend
- [`../conventions.md`](../conventions.md) — key naming, multi-tenant, errors
- [`../integration.md`](../integration.md) — how `packages/auth` and
  `packages/api` consume the cache
- [`../../auth/M0-deferred-work.md`](../../auth/M0-deferred-work.md) —
  `secondaryStorage` fix lands here
- [`../../auth/setup.md`](../../auth/setup.md) — `secondaryStorage`
  becomes a thin wrapper around `packages/cache`
- [`../../api/structure.md`](../../api/structure.md) — `src/middlewares/hono/rate-limit.ts`
  gets real logic instead of the stub

## Tracking

- Created: `apps/template/packages/cache/` skeleton in Sprint 1
- Wired in `packages/auth`: Sprint 1 (concurrent with this ADR)
- Wired in `packages/api`: Sprint 1.5
- ESLint rule: Sprint 1.5 (when we ban the direct imports)