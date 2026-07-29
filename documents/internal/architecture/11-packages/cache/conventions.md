# Conventions — keys, multi-tenant, errors

Three rule sets every consumer of `packages/cache` MUST follow.
Enforced by code review + ESLint conventions in `cache/eslint.config.js`.

## 1. Key naming

**Format**: `{domain}:{entity}:{id}` — RedisX convention, confirmed
across all senior sources.

| Component | Required | Purpose |
|---|---|---|
| `domain` | Yes | Package or feature: `auth`, `api`, `org`, `jobs` |
| `entity` | Yes | Data type: `session`, `apikey`, `rate-limit`, `cache` |
| `id` | Yes | Unique identifier (UUID, hash, or compound) |

**Examples**:
```
auth:session:abc-123
auth:apikey:ak_xyz
api:rate-limit:ip:1.2.3.4:/api/v1/ping
org:cache:user:456
```

**Multi-tenant extension** (OneUptime + RedisX pattern, tenant in
the middle):
```
auth:session:org_org_123:abc-456    ← session for user abc-456 in org org_123
api:cache:org_org_123:user:789     ← cached user 789 in org 123
```

Tenant ID is **always prefixed with `org_`** (or whatever namespace
the platform uses — `team_`, `workspace_`, etc.) to disambiguate
from non-tenant IDs and to make cross-tenant data dumps searchable.

### The mandatory key builder

Every consumer uses the exported `key` builder. **Raw string keys are
forbidden** by ESLint convention — see the regex check in
`packages/cache/eslint.config.js`.

```ts
// packages/cache/src/keys.ts (illustrative, exported as a frozen object)
export const key = Object.freeze({
  // === Single-tenant (user-global) — auth package consumes ===
  session: (token: string) => `auth:session:${token}`,
  otpCounter: (identifier: string) => `auth:otp:${identifier}`,
  rateLimitIp: (ip: string, path: string) =>
    `auth:ratelimit:ip:${ip}:${normalizePath(path)}`,
  apiKey: (keyId: string) => `auth:apikey:${keyId}`,

  // === Multi-tenant (tenant in the middle) — api package + future consumers ===
  orgSession: (orgId: string, token: string) =>
    `auth:session:org_${orgId}:${token}`,
  orgApiKey: (orgId: string, keyId: string) =>
    `auth:apikey:org_${orgId}:${keyId}`,
  orgCache: (orgId: string, entity: string, id: string) =>
    `org:cache:org_${orgId}:${entity}:${id}`,
  orgRateLimit: (orgId: string, ip: string, path: string) =>
    `api:ratelimit:org_${orgId}:ip:${ip}:${normalizePath(path)}`,
  apiKeyRateLimit: (keyId: string, path: string) =>
    `api:ratelimit:apikey_${keyId}:${normalizePath(path)}`,
})
```

Why the tenant goes **in the middle**, not at the start:

- Tools like `redis-cli MONITOR` see `auth:session:org_*:...` and
  instantly know which package is hitting Redis.
- PREFIX-isolation (when we need it) is easier: `KEYS auth:session:org_org_123:*`
  → all session keys for one tenant.
- Cross-tenant cache cleanup (GDPR right-to-be-forgotten): `SCAN`
  with `org_org_123:*` pattern.

`Object.freeze` prevents accidental mutation (and TypeScript's
`Readonly<typeof key>` type catches it at compile time).

### Key hygiene rules

**DO**:
- Lowercase, colon-separated, no spaces.
- Use UUIDs / hashes, not PII (`user:john@example.com` ← bad).
- Keep keys < 100 bytes when possible. If longer, hash the suffix:
  ```ts
  const longKey = `api:cache:user:${sha256(userId).slice(0, 16)}`
  ```

**DON'T**:
- Mix separators: `user-123_profile` ← bad.
- Embed user-controlled values directly (path traversal, cache
  poisoning).
- Use `tenant_` / `org_` prefix on non-tenant data.

## 2. Multi-tenant isolation

Three guarantees, enforced by code review:

1. **No cross-tenant reads.** If a procedure has `orgId` in its
   context, EVERY cache key it touches includes `org_orgId`. The
   `key` builder for org-scoped data REQUIRES `orgId` as a parameter
   (TypeScript-enforced — there's no overload that omits it).

2. **No cross-tenant writes.** Same — keys are org-scoped by
   construction. A bug that omits `orgId` won't compile.

3. **GDPR right-to-be-forgotten.** When an org is deleted, we
   `SCAN` all keys matching `*:org_${orgId}:*` and `DEL` them.
   Implemented as a helper:
   ```ts
   await cache.purgeTenant(orgId)  // wipes all keys for that org
   ```

### The org-scoped builder pattern

```ts
// WRONG — raw string concat, no tenant info in the key
await cache.set(`api:cache:user:${userId}`, user, { ttl: 60 })

// RIGHT — builder takes orgId explicitly, tenant goes in the middle
await cache.set(key.orgCache(orgId, 'user', userId), user, { ttl: 60 })
```

The second form is **only valid** because the consumer's procedure
**always has `orgId` in its context** (see `packages/api/src/middlewares/orpc/org-context.ts`).
Procedures that don't have `orgId` use the user-global builders
(`key.session`, etc.).

### Edge cases

- **Cross-tenant analytics** — needs aggregated data across orgs.
  Use a separate Redis namespace (e.g. `analytics:*`) with no tenant
  prefix, but rate-limited and access-controlled.
- **Platform admin views** — needs to read any org's data. The
  admin endpoint reads from the primary database, NOT the cache.
  Cache is for org-scoped data only.

## 3. Error policy

A Redis client is **best-effort by default**. Callers MUST handle
`null` as a miss, not an error.

| Failure mode | Behavior | Caller responsibility |
|---|---|---|
| Redis down (network) | `get` rejects with error, `set`/`del` reject | Caller catches; treats null-as-miss or falls back to DB |
| Key missing | `get` returns `null` | Treat as cache miss |
| TTL expired | `get` returns `null` | Same as miss |
| Decode error | `get` returns `null` (Upstash parses JSON; failure throws) | Caller catches and treats as miss |

We DO NOT add an abstraction layer for "fail-open" vs "fail-closed".
Consumers decide their policy by catching errors themselves:

```ts
// packages/auth/src/secondary-storage.ts (illustrative)
get: async (key: string) => {
  try {
    return await redis.get<string>(key)
  } catch (err) {
    // Cache miss. Better Auth will hit Postgres.
    return null
  }
}

// packages/api/src/middlewares/hono/rate-limit.ts (illustrative)
// For rate limit we DO fail closed — denying abuse is more important
// than availability during a partial outage.
const data = await redis.get<{ count: number }>(key.orgRateLimit(...))
  .catch(() => null)
if (!data) {
  // First request — let it through, set the counter, return.
} else if (data.count >= MAX) {
  // Fail-closed: if Redis was down, this branch wouldn't fire, so
  // we'd be in the !data path and let traffic through. That's the
  // known trade-off. Better Auth has the inverse trade-off.
  return c.json({ code: 'rate_limited' }, 429)
}
```

**Rate limit is fail-closed** (deny when in doubt) because the
alternative is letting abuse through. **Cache is fail-open** (treat
as miss) because the alternative is failing the whole request.
This policy is at the consumer level, not at the cache interface.

For v1, rate limiting is handled at the `packages/api` middleware
level using `redis.get` + `redis.set` (no atomic `consume`). When
race conditions become a real issue, we add a `RateLimiter`
interface or package — see `decisions/0001-why-now.md` §
"What we rejected" for the `consume` discussion.

## 4. Observability

Upstash emits its own error logs and metrics. We don't wrap them.
If we need to add structured logging later, we wrap `createRedisClient()`
to add a logging interceptor — but that's a future concern.

For tests, use the in-memory client. It throws on the same operations
as Upstash (JSON parse errors, etc.) but never on network. Tests
that exercise the error path mock the client directly.

## 5. Testing rules

- **Unit tests** use `createRedisClient({ force: 'memory' })` — no
  env, no network.
- **Integration tests** for Upstash are gated behind
  `UPSTASH_REDIS_REST_URL` env var. CI runs them only when set.
- **Consumer tests** (in `packages/auth`, `packages/api`) use the
  memory client via `createRedisClient({ force: 'memory' })`. Tests
  never hit Upstash.
- **One test per behavior, not per backend.** The contract is the
  `RedisLike` structural type; each consumer's test uses the memory
  client to exercise its own behavior.