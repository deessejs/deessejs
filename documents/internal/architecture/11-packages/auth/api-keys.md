# API keys — the bridge to `/api/v1/*`

API keys are the public REST auth surface. They hit `/api/v1/*` (the oRPC OpenAPIHandler), they're rate-limited per key, and they carry org + user context into procedures. This doc covers the full flow: creation, verification, rate limit, scopes, secondary storage, and the integration with our `AuthContext`.

## Why `@better-auth/api-key`

We considered rolling our own API key layer (hash, store, verify, rate limit, secondary cache). Better Auth's `apiKey()` plugin does all of this with the right defaults:

- **Argon2id hashing** at rest (we don't have to think about it).
- **Prefix visible** (`sk_live_<24 chars>`) for the buyer's UX (the buyer can identify which key leaked in a support ticket).
- **Built-in rate limit** per key, per window. We extend with our own per-org limit in `packages/api/middleware/rate-limit.ts`.
- **Secondary storage** — the verify path hits Upstash Redis first, falls back to Postgres on miss.
- **User-bound and org-bound keys** — the same plugin handles both. Org-bound keys are perfect for our multi-tenant.
- **Permissions (scopes)** per key — `Record<string, string[]>` like `{ "projects": ["read"], "billing": ["read"] }`. Enforced at `verifyApiKey()` time.
- **Sessions from API keys** — the API key can be "elevated" to a session, so the same `auth.api.getSession` works whether the request came from a cookie or a key.

## Configuration

```ts
// packages/auth/src/auth.ts
import { apiKey } from '@better-auth/api-key'

export const auth = betterAuth({
  // ...
  plugins: [
    apiKey({
      // Prefix shown to the buyer when they create a key
      defaultPrefix: 'sk_live_',

      // Allow metadata on keys (buyer stores custom data)
      enableMetadata: true,

      // A key can be "elevated" to a session — same code path as cookie auth
      enableSessionForAPIKeys: true,

      // Headers we accept the key in (Bearer auth or x-api-key)
      apiKeyHeaders: ['x-api-key', 'authorization'],

      // Per-key rate limit (in addition to per-org, per-endpoint in our middleware)
      rateLimit: {
        enabled: true,
        timeWindow: 60_000,    // 1 minute
        maxRequests: 100,      // 100 req/min/key by default
      },

      // Default key settings (overridable per-key at creation)
      defaultKey: {
        enabled: true,
        expiresIn: null,         // never expire by default; buyer can set per-key
        rateLimitEnabled: true,
      },
    }),
  ],
})
```

## The flow — create a key

### Org-bound key (the most common case)

```ts
// In a procedure (e.g. POST /api/v1/api-keys)
const { key, id } = await auth.api.createApiKey({
  body: {
    name: 'Production key — ci-runner',
    organizationId: ctx.auth.org.id,   // org-bound
    expiresIn: 60 * 60 * 24 * 90,        // 90 days
    prefix: 'sk_live_prod_',
    metadata: { createdBy: 'ci-runner' },
    permissions: {
      projects: ['read', 'write'],
      billing: ['read'],
    },
    rateLimitEnabled: true,
    rateLimitMax: 5000,
    rateLimitTimeWindow: 60_000,         // 5000 req/min for this key
  },
  headers: ctx.request.headers,           // the admin's session
})
// `key` is shown ONCE to the admin. They must store it. Better Auth does not return it on subsequent reads.
```

### User-bound key

Same call, but omit `organizationId`. The key belongs to the user. Useful for personal access tokens (e.g. CLI users).

## The flow — verify a key (in our Hono middleware)

```ts
// packages/api/src/middleware/auth-context.ts (the Hono /api/v1 branch)
import { auth } from '@deessejs/auth'

export const apiKeyAuth = async (c, next) => {
  const authHeader = c.req.header('Authorization')
  const apiKeyHeader = c.req.header('x-api-key')

  const rawKey = apiKeyHeader ?? (authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null)

  if (!rawKey) {
    return c.json({ code: 'unauthenticated', message: 'Missing API key' }, 401)
  }

  // The plugin's verify endpoint
  const { valid, key, error } = await auth.api.verifyApiKey({
    body: { key: rawKey },
  })

  if (!valid || !key) {
    return c.json({ code: 'unauthenticated', message: error?.message ?? 'Invalid key' }, 401)
  }

  // Build the AuthContext
  c.set('authContext', {
    type: 'api-key',
    user: key.userId,
    org: key.organizationId,
    apiKey: key,
    scopes: key.permissions ?? {},
    requestId: c.get('requestId'),
    isImpersonating: false,
    ctxLog: c.get('logger'),
  })

  await next()
}
```

**Important** : `auth.api.verifyApiKey` hits Upstash Redis first (via `secondaryStorage`), then Postgres on miss. The verify path is **fast** — typical p99 < 5ms.

## The flow — RBAC check using the key's permissions

Once the key is verified, the `AuthContext.scopes` are populated. Procedures can check:

```ts
// In a procedure
import { STATEMENTS } from '@deessejs/auth'

export const createProject = os
  .input(/* ... */)
  .handler(async ({ input, context }) => {
    if (!hasPermission(context.scopes, STATEMENTS.project.create)) {
      throw new ForbiddenError('Missing project:create permission on this API key')
    }
    // ...
  })
```

`hasPermission` is a helper from `@deessejs/auth` that checks the scope map against the statement matrix. Same helper works for cookie sessions (where the scopes come from the user's org role) and API keys (where they come from the key's permissions).

## The flow — rate limit (combined)

Rate limit is **layered** :

1. **Per-key** — Better Auth's built-in, configured via `apiKey({ rateLimit })`. 100 req/min/key by default, overridable per key.
2. **Per-org** — our middleware in `packages/api/middleware/rate-limit.ts`. Token bucket via Upstash Redis. 1000 req/min/org by default.
3. **Per-endpoint** — overrides per route (e.g. `webhooks.send = 10 req/min/key`).

A request that exceeds any layer gets a 429 with `Retry-After` and the standard rate-limit error shape.

## The flow — secondary storage

The `apiKey()` plugin uses `secondaryStorage` for the key lookup cache. On verify:

1. **Upstash Redis** GET `auth:apikey:<hash>` → cache hit, return the key metadata.
2. On miss → Postgres SELECT, then SETEX in Redis with the configured TTL.

The TTL is configurable; default is 5 minutes. Bumping the TTL reduces DB load but increases the window during which a revoked key is still accepted. **We use 5 minutes as a balance.**

The `secondaryStorage` is the same one used for sessions and rate limit — single Redis namespace, one eviction policy.

## The flow — scopes are part of the public API contract

API key scopes are **part of the OpenAPI spec** (the `permissions` field on the API key resource). When a buyer creates a key, they pick scopes from a fixed list. When their end user uses the key, the SDK / CLI surfaces the granted scopes.

**Implication for the docs site** : the API key resource and its scope enums are auto-generated into the public docs (Fumadocs OpenAPI integration). The buyer sees exactly which scopes exist and what they grant.

## The flow — list and revoke (admin)

Better Auth provides `auth.api.listApiKeys`, `auth.api.deleteApiKey`, `auth.api.updateApiKey`. These are exposed as oRPC procedures in the admin section:

- `GET /api/v1/api-keys` — list keys for the org
- `POST /api/v1/api-keys/{id}/revoke` — disable a key (we use `updateApiKey({ enabled: false })`)
- `POST /api/v1/api-keys/{id}/delete` — hard delete (Better Auth's `deleteApiKey`)

The list endpoint returns all keys except the hash and the prefix's last few chars — only the buyer can see what they need to revoke a leaked key.

## When to use API keys vs cookie sessions

| Use case | Auth method |
|---|---|
| Web app, same-origin, browser | Cookie session (Better Auth default) |
| Server-to-server (CI, backend) | API key, org-bound |
| CLI on a developer's machine | API key, user-bound |
| Mobile native (future) | OAuth flow + API key after sign-in |
| Third-party integration (Stripe webhooks, etc.) | Webhooks (HMAC), not API keys |

API keys are **not** for end-user authentication in a browser. Use the cookie flow. The keys are for **machine identities**.

## Security notes

- **API keys are shown ONCE at creation.** Better Auth does not return the full key on subsequent reads. The buyer is responsible for storing it.
- **Hashed at rest** with argon2id (Better Auth default). We do not see the raw key after creation.
- **Revocation is immediate** in Postgres; cache eviction is up to 5 minutes (secondary storage TTL).
- **Rotation** is a buyer action: create a new key, deploy it, revoke the old one. We don't have automatic rotation in v1.
- **Leaked key disclosure** — the buyer shares the prefix + last few chars (Better Auth surfaces these on read). We can identify which key was leaked and revoke it.

## Cross-references

- [`setup.md`](./setup.md) — the `apiKey({...})` config in `auth.ts`
- [`plugins.md`](./plugins.md) — the plugin rationale and the spec mapping
- [`../database/decisions/0001-tenant-wrapper-vs-rls.md`](../database/decisions/0001-tenant-wrapper-vs-rls.md) — how `orgId` is enforced on the data layer
- [`../api/decisions/0001-...`](../api/) (TODO) — the AuthContext shape and the Hono middleware composition
- [Better Auth — API key plugin](https://www.better-auth.com/docs/plugins/api-key) — official docs
