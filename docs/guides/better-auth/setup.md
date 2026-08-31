# Better-Auth: Setup

Base configuration for Better-Auth in this repo. See [`index.md`](./index.md) first for locked-in decisions.

---

## Package Layout

```
packages/auth/src/auth.ts         — better-auth() instance (SINGLE SOURCE OF TRUTH)
packages/database/src/schema/auth.ts — Drizzle tables (generated, do not edit manually)
```

All other packages import from `packages/auth`, never directly from `better-auth`.

---

## Base Configuration

```ts
import { betterAuth } from "better-auth"
import { drizzleAdapter } from "@better-auth/drizzle-adapter"
import { nextCookies } from "better-auth/next-js"
import { db } from "@workspace/database"

export const auth = betterAuth({
  baseURL: {
    allowedHosts: [
      "app.deessejs.com",
      "deessejs.com",
      "docs.deessejs.com",
      "*.vercel.app",
      // Spread localhost in dev only; see pitfalls.md §5 for the
      // NODE_ENV-gated reason.
      ...(process.env.NODE_ENV === "development"
        ? ["localhost:3000", "localhost:3001"]
        : []),
    ],
    protocol: process.env.NODE_ENV === "development" ? "http" : "https",
  },
  secret: serverEnv.BETTER_AUTH_SECRET,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema,
  }),
  plugins: [
    nextCookies(), // must be last
  ],
})
```

**Source:** [Better-Auth docs/reference/options](https://better-auth.com/docs/reference/options), base config reference; [Better-Auth docs/guides/dynamic-base-url](https://better-auth.com/docs/guides/dynamic-base-url) for the dynamic `baseURL` form and Vercel preview support.

> **Note:** this template is **single-tenant** (see `index.md` "Locked-in Decisions"). The codebase doesn't include an organization plugin or an org schema. Don't reintroduce. <!-- vale fix: write-good.ThereIs, Microsoft.Contractions -->

---

## Environment Variables

| Variable | Required | Notes |
|---|---|---|
| `BETTER_AUTH_SECRET` | Yes | Min 32 chars. Generate: `openssl rand -base64 32` |
| `DATABASE_URL` | Yes (runtime) | Postgres connection string. CLI scripts tolerate absence |
| `BETTER_AUTH_URL` | No | Legacy single-origin reference for tooling (`drizzle-kit`, scripts). The auth handler resolves the per-request origin from the `x-forwarded-host` / `host` headers against the `allowedHosts` list. See [`pitfalls.md`](./pitfalls.md) §5. |
| `ALLOWED_ORIGINS` | No | CSV list of ad-hoc extras for `trustedOrigins` (staging, partner origins). The prod origins and `*.vercel.app` are auto-added via `allowedHosts`. Defaults to `localhost:3000,localhost:3001` in dev only. |

`AUTH_SECRET` works as an alias for `BETTER_AUTH_SECRET`. See `packages/env/src/schema.ts`. <!-- vale fix: write-good.Passive -->

**Source:** [Better-Auth docs/reference/options](https://better-auth.com/docs/reference/options), `baseURL`, `secret`, `trustedOrigins`.

---

## Secrets

better-auth uses the secret for:
- Cookie signing (JWE for cached sessions)
- Token encryption / hashing

Generate with:
```bash
openssl rand -base64 32
```

Versioned secrets for non-disruptive rotation:
```ts
secret: "new-secret",
secrets: ["new-secret", "old-secret"], // old-secret is decrypt-only
```

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options), `secret` and `secrets`.

---

## Trusted Origins

Each entry in `allowedHosts` is auto-added to `trustedOrigins` (with both `http` and `https` for localhost). Use `ALLOWED_ORIGINS` for ad-hoc extras that aren't in `allowedHosts` — staging, partner origins, etc.: <!-- vale fix: write-good.TooWordy, write-good.Passive -->

```ts
trustedOrigins: serverEnv.ALLOWED_ORIGINS,
```

**Warning:** hardcoded localhost origins in `trustedOrigins` are a prod risk if `ALLOWED_ORIGINS` is empty. See [`pitfalls.md`](./pitfalls.md) §2 (the `localhost` gate) and §5 (the dynamic `baseURL` form that supersedes this list).

**Source:** [Better-Auth docs/reference/options](https://better-auth.com/docs/reference/options), `trustedOrigins` with wildcard patterns.

---

## Cookies

Cookies are `httpOnly` and `secure` by default in production. Configure via `advanced`:

```ts
advanced: {
  useSecureCookies: process.env.NODE_ENV === "production",  // ⚠️ never set this to `true` unconditionally — see pitfalls.md §4
  cookiePrefix: "my-app",  // prefix: "my-app.session_token"
  crossSubDomainCookies: {  // for subdomain sharing
    enabled: true,
    domain: "app.example.com",
  },
},
```

Custom cookie names:
```ts
advanced: {
  cookies: {
    session: { name: "my_session" },
  },
},
```

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies), cookie config, `crossSubDomainCookies`.

---

## drizzle Adapter

Provider options: `"pg"`, `"sqlite"`, `"mysql"`, `"sqlite/wasm"`, `"libsql"`.

```ts
drizzleAdapter(db, {
  provider: "pg",
  schema,              // must include all Drizzle relations for joins
  usePlural: false,    // set true for plural table names (e.g. "users" not "user")
})
```

Generate the schema with:
```bash
pnpm auth:generate   # or: better-auth generate --config ./src/auth.ts --output ../database/src/schema/auth.ts
``` <!-- vale fix: write-good.Passive -->

**Important:** after running `pnpm auth:generate`, review the diff before committing. The CLI may overwrite custom field names or indexes.

**Source:** [Better-Auth docs/adapters/drizzle](https://better-auth.com/docs/adapters/drizzle), adapter docs with `usePlural`, `modelName`, `fields` options.

---

## Next.js Integration

`nextCookies()` must be the **last** plugin:

```ts
plugins: [
  nextCookies(),  // ← last
],
```

The handler is mounted at `/auth/*` in `packages/api/src/index.ts`:

```ts
api.on(["POST", "GET"], "/auth/*", (c) => {
  return auth.handler(c.req.raw)
})
```

**Source:** [better-auth.com/docs/integrations/next-js](https://better-auth.com/docs/integrations/next-js), Next.js integration docs.

---

## Experimental Features

`experimental.joins: true` enables eager-loading relations. The schema must define drizzle `relations()` and pass them through the adapter's `schema` object. <!-- vale fix: write-good.Passive -->

```ts
experimental: {
  joins: true,
},
```

This is **experimental**. Test on each Better-Auth upgrade. <!-- vale fix: Microsoft.Adverbs -->

**Source:** [Better-Auth docs/adapters/drizzle](https://better-auth.com/docs/adapters/drizzle), joins (experimental) section.

---

## Health Checks

The API exposes:
- `GET /api/health` always returns `{ status: "ok" }`
- `GET /api/ready` is a readiness probe (currently no DB check; see [`pitfalls.md`](./pitfalls.md))

For a proper readiness probe, add a DB ping:
```ts
api.get("/ready", async (c) => {
  try {
    await db.execute(sql`SELECT 1`)
    return c.json({ status: "ready" })
  } catch {
    return c.json({ status: "not ready" }, 503)
  }
})
```
