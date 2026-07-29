# Integrations — Hono + Drizzle wiring

The patterns for wiring Better Auth into the rest of the DeesseJS stack. Three integrations covered here:

1. **Hono mount** — `auth.handler` on the Hono app.
2. **Session middleware** — `auth.api.getSession` per request, with the `cookieCache` workaround.
3. **Drizzle schema assembly** — how the split schema files in `packages/database` get composed into the single object the adapter expects.

The `createAuth()` skeleton is in [`setup.md`](./setup.md). This doc is the **wiring** around it.

> **Gotcha at the top** : the official Hono integration docs show a `getSession` pattern that silently breaks when `cookieCache` is enabled (the refresh `set-cookie` is dropped). We use the `asResponse: true` workaround documented in §2 below. This is suboptimal but is the current official pattern. We migrate to `returnHeaders` (issue #3996) when it ships. See [`security-baseline.md`](./security-baseline.md) for the tracking note.

## 1. Hono mount

### The basic mount

```ts
// packages/api/src/hono/mount-auth.ts
import { Hono } from 'hono'
import { auth } from '@deessejs/auth'

const authRoutes = new Hono()

authRoutes.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

export { authRoutes }
```

- `auth.handler` is a Fetch-API handler. It takes `c.req.raw` (the raw `Request`), returns a `Response`.
- Both **POST and GET** are required on the same path. Some endpoints are GET (`/api/auth/session`, `/api/auth/callback/*`); some are POST (`/api/auth/sign-in/email`, `/api/auth/sign-out`).
- The path matches the `basePath` in the Better Auth config (default: `/api/auth`).

### CORS — must come BEFORE the mount

```ts
import { cors } from 'hono/cors'

authRoutes.use(
  '/api/auth/*',
  cors({
    origin: (origin) => {
      // Allow the app origin, the preview deploys, and localhost in dev
      if (origin === process.env.NEXT_PUBLIC_APP_URL) return origin
      if (origin.endsWith('.vercel.app')) return origin  // previews
      if (origin.startsWith('http://localhost:')) return origin
      return null  // rejected
    },
    allowHeaders: ['Content-Type', 'Authorization'],
    allowMethods: ['POST', 'GET', 'OPTIONS'],
    exposeHeaders: ['Content-Length'],
    maxAge: 600,
    credentials: true,  // required for cookies
  }),
)

authRoutes.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))
```

**Critical** : CORS middleware **must** be registered before the route handler. If it comes after, the preflight `OPTIONS` request is not handled and the browser blocks the actual request.

`credentials: true` is **required** for cookies to flow on cross-origin requests. Pair with `SameSite` on the cookie (see cross-subdomain section below).

### Cross-subdomain cookies

If the app runs on subdomains (`app.example.com`, `api.example.com`, `admin.example.com`), the session cookie must be **shared** across them. The right way:

```ts
// packages/auth/src/auth.ts
export const auth = betterAuth({
  advanced: {
    crossSubDomainCookies: {
      enabled: true,
      domains: [process.env.PARENT_DOMAIN],  // e.g. 'example.com'
    },
  },
})
```

This is **preferred over `SameSite=None`** because SameSite=None has security tradeoffs (CSRF risk, requires `Secure` and the new `Partitioned` attribute).

If cross-subdomain is not possible (genuine cross-origin, e.g. `app.com` and `app.io`), then:

```ts
export const auth = betterAuth({
  advanced: {
    defaultCookieAttributes: {
      sameSite: 'none',
      secure: true,
      partitioned: true,  // Chrome's new CHIPS attribute — required for foreign cookies
    },
  },
})
```

The buyer enables one or the other in the onboarding wizard. We document both; the wizard guides them.

### The Hono app composition

In `packages/api/src/app.ts`, the auth routes are mounted first (so the session middleware can use the handler internally if needed), then the rest:

```ts
import { Hono } from 'hono'
import { authRoutes } from './hono/mount-auth'
import { orpcRoutes } from './hono/mount-rpc'
import { openApiRoutes } from './hono/mount-openapi'
import { sessionMiddleware } from './middleware/auth-context'
import { requestIdMiddleware } from './middleware/request-id'

const app = new Hono<{ Variables: AppVariables }>()

// Order matters: request-id first (for logs), then session (consumes request),
// then the routes that need the auth context.
app.use('*', requestIdMiddleware)
app.use('*', sessionMiddleware)
app.route('/', authRoutes)
app.route('/', orpcRoutes)         // /rpc/*
app.route('/', openApiRoutes)      // /api/v1/*

export { app }
```

## 2. Session middleware — the `cookieCache` workaround

### The naive pattern (broken with `cookieCache`)

```ts
// ❌ This silently drops the cookieCache refresh header
app.use('*', async (c, next) => {
  const session = await auth.api.getSession({ headers: c.req.raw.headers })
  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }
  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})
```

**Why it breaks** : when `cookieCache: { enabled: true, maxAge: 5*60 }` is set, Better Auth refreshes the cookie on each request. The refresh is in a `set-cookie` header on the response. The naive pattern throws the response away, so the refresh never reaches the browser. The session cookie expires abruptly at the 7-day mark instead of being silently extended.

### The workaround (works, suboptimal)

```ts
// ✅ Use asResponse: true, propagate the set-cookie back to Hono
app.use('*', async (c, next) => {
  const response = await auth.api.getSession({
    headers: c.req.raw.headers,
    asResponse: true,
  })

  // Propagate cookie refresh (and any other set-cookie) back to the Hono response
  for (const [key, value] of response.headers) {
    if (key === 'set-cookie') {
      c.header(key, value, { append: true })
    }
  }

  const session = await response.json()

  if (!session) {
    c.set('user', null)
    c.set('session', null)
    return next()
  }

  c.set('user', session.user)
  c.set('session', session.session)
  return next()
})
```

**Cost** : the JSON body is parsed twice (once to extract headers, once for the context). The cost is small (~50-200 µs) but it's not zero. We accept it because the alternative — losing cookie refresh — is worse.

**Tracking** : Better Auth issue [#3996](https://github.com/better-auth/better-auth/issues/3996) requests a `returnHeaders: true` option that returns `{ session, headers }` in a single call. Closed as duplicate of #3780. Not shipped as of 1.6.19. When it lands, the workaround becomes a one-line change.

### The Hono Variables type

The `Variables` type tells Hono what `c.get('user')` and `c.get('session')` return:

```ts
import { auth } from '@deessejs/auth'

type AppVariables = {
  user: typeof auth.$Infer.Session.user | null
  session: typeof auth.$Infer.Session.session | null
  // ... plus the rest of the AuthContext (see packages/api)
  org: { id: string; role: string } | null
  apiKey: typeof auth.$Infer.APIKey | null
  requestId: string
  ctxLog: Logger
}

const app = new Hono<{ Variables: AppVariables }>()
```

`auth.$Infer.Session.user` and `.session` are the Better Auth inferred types. `auth.$Infer.APIKey` is the API key type when the `apiKey()` plugin is enabled.

### Extending the AuthContext — the bridge to our packages

The middleware above sets `user` and `session`. Our `AuthContext` (consumed by procedures in `packages/api`) is richer — it also has `org`, `apiKey`, `scopes`, `requestId`, `ctxLog`. The extension happens in `packages/api/src/middleware/auth-context.ts`, which runs after the Better Auth session middleware:

```ts
// packages/api/src/middleware/auth-context.ts (sketch)
import { auth } from '@deessejs/auth'
import { createRepos } from '@deessejs/database'
import { db } from '@deessejs/database'

export const authContextMiddleware = async (c, next) => {
  const user = c.get('user')
  const session = c.get('session')

  // Read the active org from the session (set by the org plugin via session.activeOrganizationId)
  const activeOrgId = session?.activeOrganizationId ?? null

  if (!user || !activeOrgId) {
    c.set('authContext', { authenticated: false, /* ... */ })
    return next()
  }

  // Build the typed repos bound to (db, orgId)
  const repos = createRepos(db, activeOrgId)

  c.set('authContext', {
    authenticated: true,
    user,
    org: { id: activeOrgId, role: /* resolved from member table */ },
    apiKey: c.get('apiKey'),  // populated by the API key middleware (separate)
    scopes: /* computed from role or api key */,
    requestId: c.get('requestId'),
    ctxLog: c.get('ctxLog'),
  })

  return next()
}
```

This is the **seam** between Better Auth and the rest of the system. Procedures read `c.get('authContext')` and never know about cookies or API keys.

## 3. Drizzle schema assembly

The `drizzleAdapter` takes one `schema` object. The auth tables are generated into `packages/database/src/schema/auth/` as multiple files (`auth-users.ts`, `auth-sessions.ts`, etc.). The non-auth tables are in `packages/database/src/schema/<feature>/` (one folder per feature module). They all need to compose into one schema object.

### The composition

```ts
// packages/database/src/schema/index.ts
import * as authSchema from './auth'  // generated, committed
import * as usersSchema from './users'  // our own feature module
import * as orgsSchema from './orgs'
import * as billingSchema from './billing'
// ... one import per feature

import { defineRelations } from 'drizzle-orm'

// One object containing every table
export const schema = {
  ...authSchema,
  ...usersSchema,
  ...orgsSchema,
  ...billingSchema,
  // ...
}

// One RQBv2 relations definition covering all tables (auth + ours)
export const relations = defineRelations(schema, (r) => ({
  // auth relations (added manually after schema generation)
  users: {
    sessions: r.many.sessions(),
    accounts: r.many.accounts(),
    members: r.many.members(),
  },
  sessions: {
    user: r.one.users({ from: r.sessions.userId, to: r.users.id }),
  },
  accounts: {
    user: r.one.users({ from: r.accounts.userId, to: r.users.id }),
  },
  organizations: {
    members: r.many.members(),
    invitations: r.many.invitations(),
  },
  members: {
    user: r.one.users({ from: r.members.userId, to: r.users.id }),
    org: r.one.organizations({ from: r.members.organizationId, to: r.organizations.id }),
  },
  invitations: {
    org: r.one.organizations({ from: r.invitations.organizationId, to: r.organizations.id }),
  },
  // ... plus our feature relations
}))
```

### Passing the schema to the adapter

```ts
// packages/auth/src/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db, schema } from '@deessejs/database'

export const auth = betterAuth({
  database: drizzleAdapter(db, {
    provider: 'pg',
    schema,                // ← tables (and relations, if the adapter supports it)
    usePlural: true,
    experimental: { joins: true },  // requires relations to be defined
  }),
  // ...
})
```

**Important** : for `experimental.joins: true` to actually use the relations, the `schema` passed to the adapter must be the one that includes the RQBv2 relations. If we only pass `{ ...authSchema, ...featureSchema }` without the relations, the joins are no-ops and the perf win disappears.

### When the auth tables need a new column (post-bump)

When Better Auth ships a patch that adds a new field to the `user` table:

1. Run `pnpm auth generate --output ../database/src/schema/auth/`.
2. Review the diff. The new column should appear in the regenerated file.
3. **Add the corresponding RQBv2 relation** (if any) in `packages/database/src/relations.ts`. The generator does NOT produce relations.
4. Commit both.
5. Run `pnpm --filter @deessejs/database db:generate` to produce the SQL migration. Commit.
6. Update the `feature = ` lines in the migration files to make the change auditable.

### Multi-schema (pg namespace) — PR #7169

Better Auth is in the process of supporting `pgSchema('auth')` for the auth tables (so they live in `auth.*` instead of `public.*`). Useful for buyers who want to namespace their DB.

As of 1.6.19, this is **in progress** (PR #7169). We track it for v2. For v1, all tables live in `public` (or whatever the buyer's default schema is).

## 4. Common integration gotchas

| # | Gotcha | Sévérité | Mitigation |
|---|---|---|---|
| 1 | `cookieCache` refresh dropped without `asResponse: true` | HIGH | Use the §2 workaround. Track returnHeaders issue. |
| 2 | `schema` passed to the adapter must include RQBv2 relations for `joins: true` to work | HIGH | Document the assembly pattern. Lint rule (optional) that `defineRelations` is always passed the full `schema`. |
| 3 | `getSession` returns `null` on unauthenticated, throws on DB error | MEDIUM | Wrap in try/catch. Log DB errors as 5xx. |
| 4 | Better Auth reads `process.env` at instantiation | LOW | Document the order: env loaded → `auth` instantiated. The Next.js bundle does this naturally. |
| 5 | Cookie attributes conflict between Better Auth's `cookieOptions` and Hono's `cors` | MEDIUM | Set `SameSite=Lax` (default) + `Secure` (prod only) on the cookie. Pair with `credentials: true` in CORS. |
| 6 | The generated schema may have changed field names vs what plugins expect after a bump | MEDIUM | Run `npx auth generate` after every bump, review diff, run full test suite. |
| 7 | The Hono client (`hc<AppType>`) needs `credentials: 'include'` for cookies to flow | LOW | Document in the client setup. |
| 8 | `experimental.joins: true` is opt-in but critical for perf | MEDIUM | ON by default in our `setup.md`. |

## 5. Testing the integration

The integration tests live in `packages/auth/tests/integration/`:

```ts
// packages/auth/tests/integration/hono-mount.test.ts
import { Hono } from 'hono'
import { authRoutes } from '@deessejs/api/hono/mount-auth'

describe('Better Auth Hono mount', () => {
  it('handles POST to /api/auth/sign-in/email', async () => {
    const app = new Hono().route('/', authRoutes)
    const res = await app.request('/api/auth/sign-in/email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'test@example.com', password: 'test1234' }),
    })
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body.user.email).toBe('test@example.com')
    // Check the set-cookie is set
    expect(res.headers.get('set-cookie')).toContain('session_token')
  })

  it('handles GET to /api/auth/session without auth', async () => {
    const app = new Hono().route('/', authRoutes)
    const res = await app.request('/api/auth/session')
    expect(res.status).toBe(200)
    const body = await res.json()
    expect(body).toBeNull()
  })
})
```

```ts
// packages/auth/tests/integration/cookie-cache.test.ts
describe('Session middleware with cookieCache', () => {
  it('propagates the set-cookie refresh on the next request', async () => {
    // Sign in, get a session cookie
    // Wait 1ms (not really, but the cache maxAge is 5min by default)
    // Make a request, capture the response's set-cookie
    // Assert the cookie was refreshed (or unchanged, depending on the test)
  })
})
```

The `cookieCache` test is the one that catches the §2 gotcha. It is **mandatory** before merging any auth-related change.

## Cross-references

- [`setup.md`](./setup.md) — the `createAuth()` skeleton and the `createAccessControl(...)` RBAC matrix
- [`plugins.md`](./plugins.md) — the plugin stack (organization, admin, apiKey, etc.)
- [`api-keys.md`](./api-keys.md) — the `verifyApiKey` flow that complements `getSession`
- [`security-baseline.md`](./security-baseline.md) — version policy and the #3996 tracking note
- [`../database/README.md`](../database/README.md) — the Drizzle client and the schema layout
- [`../database/relations.md`](../database/relations.md) — RQBv2 relations
- [`../database/decisions/0002-drizzle-v1-rc.md`](../database/decisions/0002-drizzle-v1-rc.md) — Drizzle v1 RC choice
- [`../api/README.md`](../api/README.md) — the `AuthContext` shape consumed by procedures
