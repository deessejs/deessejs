# `packages/auth` — M0 deferred work (must ship before /api/v1/* is public)

Three gaps were identified during the Sprint 0 + Sprint 1 review of
`packages/auth` (2026-06-19). They are **NOT bugs in the current code** —
they are work that the architecture docs recommended but that the
Sprint 0 implementation deferred to keep the scaffold minimal.

**All three are blocking for production** with at least one
authenticate-or-rate-limit endpoint exposed. None of them block the
Sprint 1 work (building `packages/api` and the first feature module)
because they only matter when the API serves real traffic.

---

## 1. `satisfies BetterAuthOptions` — fix Better Auth type inference

**Severity**: TypeScript-only (DX). No runtime impact.

**Problem**: `packages/auth/src/auth.ts` builds the Better Auth instance
inline and re-exports it via `as unknown as Auth`:

```ts
const _auth = betterAuth({
  database: drizzleAdapter(db, { /* ... */ }),
  plugins: [organization(), twoFactor(), apiKey(), ...],
  // ...
})
export const auth = _auth as unknown as Auth
```

Better Auth infers its API surface via the `Options["plugins"]` tuple.
When `betterAuth({...})` is called inline, the generic IS preserved —
**but the cast `as unknown as Auth` throws it away**. The exported `Auth`
type is `typeof betterAuth<BetterAuthOptions>` with a generic
`BetterAuthOptions` placeholder, not our concrete config.

**Downstream impact**: `auth.api` in `@deessejs/auth` only exposes the
core methods (`ok`, `error`). Methods added by plugins
(`getFullOrganization`, `getActiveMemberRole`, `setActiveOrganization`,
`createApiKey`, `verifyApiKey`, etc.) are NOT in the inferred type.

That's why `packages/api/src/middlewares/hono/auth-client.ts` exists:
it casts `auth.api as unknown as { getFullOrganization: ...,
getActiveMemberRole: ... }` to recover the lost methods. The cast
exists only because of the upstream inference bug — once we fix
the auth package, we can delete `auth-client.ts`.

**Fix** (per [Better Auth issue #4222](https://github.com/better-auth/better-auth/issues/4222)):

```ts
// packages/auth/src/auth.ts
const options = {
  database: drizzleAdapter(db, { /* ... */ }),
  plugins: [organization(), twoFactor(), apiKey(), /* ... */],
  // ... all other config
} as const

const _auth = betterAuth(options)
export const auth = _auth  // no cast needed — generic is preserved
```

By passing the same `options` object into `betterAuth(...)`, the
generic `Auth<typeof options>` keeps the plugin tuple. Every method
the plugins add becomes accessible in the inferred type.

**Effort**: 15 minutes (change 5 lines in `auth.ts`, then delete the
cast in `auth-client.ts` and update imports — one-line change per
consumer).

**Tracking**: `auth-client.ts` is the canary. When the upstream fix
lands (or we apply this pattern), delete `auth-client.ts` and rename
imports.

---

## 2. `secondaryStorage` — rate limiting broken in production

**Severity**: **CRITICAL security gap**. Rate limit spec 1.23 is
unenforced in production as of 2026-06-22.

**Problem**: `packages/auth/src/auth.ts` configures `secondaryStorage`
as a no-op stub:

```ts
secondaryStorage: {
  get: async () => null,
  set: async () => {},
  delete: async () => {},
}
```

`secondaryStorage` is the backing store for THREE Better Auth features:

- **Session cache** — every `getSession` call hits Postgres
  instead of reading from cache.
- **Rate limiting** — the auth config has
  `rateLimit: { storage: 'secondary-storage', customRules: { ... } }`.
  With a no-op storage, **the rate limits are not enforced**.
- **API key cache** — `@better-auth/api-key` plugin stores lookups
  here. Every verify hits Postgres.

**Why the no-op is broken (verified by reading the source)**:
`packages/better-auth/src/api/rate-limiter/index.ts:266-280` does:

```ts
const data = await storage.get(key)   // our no-op returns null

if (!data) {
  await storage.set(key, { count: 1, lastRequest: now })
}
```

Our `get` returns `null` on EVERY call, so `count` resets to 1 on
every request. **`shouldRateLimit(max, window, count)` never returns
true.** The rate limit is entirely inoperative — not just weakened,
**broken at the sequential level** before we even talk about race
conditions.

**Test evidence**: our own test suite emits this warning on every run:

```
WARN [Better Auth]: Rate limiting is best-effort: the configured
storage has no atomic `consume`, so concurrent requests may bypass
the limit. Provide a storage that implements `consume` for strict
enforcement.
```

**Production risk**: a brute-force attack on `/api/auth/sign-in/email`
can send unlimited requests because nothing is rate-limiting them. This
violates spec 1.23. The hosting docs (`hosting.md` §env vars) already
list `UPSTASH_REDIS_REST_URL` + `UPSTASH_REDIS_REST_TOKEN` as required —
we just never wired them.

**Fix** (the canonical Upstash pattern, from
[upstash.com/blog/better-auth-with-redis](https://upstash.com/blog/better-auth-with-redis)):

```ts
import { Redis } from '@upstash/redis'

const redis =
  process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN
    ? new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      })
    : null

secondaryStorage: redis
  ? {
      get:    async (key) => await redis.get(key),
      set:    async (key, value, ttl) => {
        if (ttl) await redis.set(key, value, { ex: ttl })
        else    await redis.set(key, value)
      },
      delete: async (key) => await redis.del(key),
    }
  : undefined,
```

Make Redis **optional** (the Upstash blog's recommended pattern): in
dev without Upstash env vars, `secondaryStorage` is undefined and
Better Auth falls back to its DB storage. No code change needed.

**On the optional `consume` method**:

The `consume` method is **optional**. Without it:

- Sequential rate limiting works correctly (the `get`/`set` flow above)
- Race conditions on concurrent requests can leak 1-2 requests past
  the limit per window (tolerable for most SaaS)

With it (using INCR + EXPIRE pipeline):

- Zero race conditions, strict enforcement
- Required only for high-concurrency endpoints (e.g. `/sign-in/email`
  under attack)

For v1, **ship without `consume`**. Add it if monitoring shows the
race-condition leak is a real problem (it won't be — typical SaaS sees
< 100 req/s on auth endpoints).

```ts
// Only if/when we need strict atomic rate limiting:
consume: async (key, limit, window) => {
  const tx = redis.pipeline()
  tx.incr(key)
  tx.expire(key, window)  // safe to call every time; Redis no-ops if already set
  const [count] = await tx.exec<number>()
  return { success: count <= limit, remaining: Math.max(0, limit - count) }
},
```

**Additional config** (for live-app safety once we have users):

```ts
session: {
  storeSessionInDatabase: true,
  preserveSessionInDatabase: true,
},
```

This keeps existing sessions in Postgres when secondaryStorage is
added, so users don't get logged out during the upgrade.

**Effort**: 1-2 hours (install `@upstash/redis`, wire the optional
storage, add an integration test that hits `/sign-in/email` 6 times
and verifies the 6th gets a 429).

**Tracking**: in M1, before any `/api/v1/*` endpoint is exposed publicly.

---

## 3. `experimental.joins` — 3-4x more DB queries per authenticated request

**Severity**: **Performance gap**. Visible at >10 req/s. Free fix.

**Problem**: `packages/auth/src/auth.ts` configures the Drizzle adapter
without `experimental.joins: true`:

```ts
database: drizzleAdapter(db, {
  provider: 'pg',
  schema,
  usePlural: true,
  // ❌ missing: experimental: { joins: true }
}),
```

Without it, `auth.api.getSession({ headers })` executes 3-4 separate
SELECTs (sessions + users + accounts + members). With
`experimental.joins: true`, it executes ONE SELECT with JOINs.

The pattern was documented in `integrations.md` §2 ("the cookieCache
workaround") and in our own `auth/integrations.md` §2 (which recommends
`experimental.joins: true` for 2-3x perf on session fetches). We
documented it, didn't apply it.

**Production impact** at modest scale (100 req/s authenticated):

- Without joins: ~400 SELECT/s on the auth tables
- With joins: ~100 SELECT/s on the auth tables
- 3-4x reduction in DB load

**Fix** (1 line):

```ts
database: drizzleAdapter(db, {
  provider: 'pg',
  schema,
  usePlural: true,
  experimental: { joins: true },  // ← 2-3x perf
}),
```

**Caveat to verify before merging**: `experimental.joins: true`
requires the Drizzle schema to have either:
- Global `defineRelations(...)` (RQBv2, Drizzle 1.x style), OR
- Per-table `relations()` exports on the schema namespace (Drizzle 0.x style)

Our current schema (`packages/database/src/schema/auth/index.ts`) uses
the per-table `relations()` 0.x style, which the Drizzle adapter should
support. **Before enabling `experimental.joins`, verify with a quick
integration test that `getSession` returns the right shape and that
the SQL emitted uses JOINs** (enable Drizzle logging temporarily).

**Effort**: 30 seconds for the code change, plus a smoke test to
verify the SQL shape didn't regress.

---

## Recommended order

1. **#3 first** (`experimental.joins`) — fastest win, ~30 sec.
   Verify with a smoke test that getSession still returns the right
   shape. Lowest risk.
2. **#1 second** (`satisfies BetterAuthOptions`) — 15 min. Clean
   cleanup, deletes `auth-client.ts` in the api package. Low risk.
3. **#3 last** (`secondaryStorage`) — 1-2 hours. Blocking for
   production. Needs Upstash account provisioned before code can be
   deployed.

## Verification (after each fix)

- `pnpm typecheck` in `packages/auth` and `packages/api`
- `pnpm test` in `packages/api` — all 13 tests should still pass
- (For #2 only) integration test: hit `/api/auth/sign-in/email` 6×,
  verify 6th gets 429
- (For #3 only) temporarily enable Drizzle logging, verify getSession
  emits 1 JOIN query, not 3-4

## Cross-references

- `integrations.md` §2 — the cookieCache workaround (related: the
  `asResponse: true` pattern in `packages/api/src/middlewares/hono/auth-context.ts`)
- `security-baseline.md` — version pinning for Better Auth 1.6.19
- `decisions/0001-security-baseline-1.6.19.md` — the ADR that pins 1.6.19
- `hosting.md` §env vars — lists `UPSTASH_REDIS_REST_URL` +
  `UPSTASH_REDIS_REST_TOKEN` as required (we never wired them)