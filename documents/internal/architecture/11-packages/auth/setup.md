# Setup — the `createAuth()` configuration

The single file that defines the Better Auth instance. It binds the Drizzle adapter, the plugins, the RBAC, and the hooks.

> **Wiring is elsewhere.** This doc covers the `createAuth()` skeleton. The Hono mount, the session middleware (with the `cookieCache` workaround), and the Drizzle schema assembly are in [`integrations.md`](./integrations.md). The Hono `Variables` type and the bridge to our `AuthContext` are also in `integrations.md`. The operational runbook (advisory monitoring, bump procedure) is in [`security-baseline.md`](./security-baseline.md).

## The `auth.ts` skeleton

```ts
// packages/auth/src/auth.ts
import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { db } from '@deessejs/database'

import { organization } from 'better-auth/plugins'
import { admin } from 'better-auth/plugins'
import { apiKey } from '@better-auth/api-key'
import { twoFactor } from 'better-auth/plugins'
import { passkey } from 'better-auth/plugins'
import { magicLink, emailOtp } from 'better-auth/plugins'
import { oAuthProxy } from 'better-auth/plugins'

import { accessControl, STATEMENTS, ROLES } from './access-control'
import { organizationHooks } from './hooks/organization-hooks'
import { databaseHooks } from './hooks/database-hooks'

export const auth = betterAuth({
  // === Database ===
  database: drizzleAdapter(db, {
    provider: 'pg',
    usePlural: true,           // tables are `users`, not `user`
    experimental: { joins: true },  // 2-3x perf on session fetches
  }),

  // === Base config ===
  baseURL: process.env.BETTER_AUTH_URL,
  secret: process.env.BETTER_AUTH_SECRET,
  trustedOrigins: [process.env.NEXT_PUBLIC_APP_URL],

  // === Email & password ===
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,  // spec 1.14
    sendResetPassword: async ({ user, url }) => { /* Resend */ },
  },

  // === Email verification + magic link ===
  emailVerification: {
    sendVerificationEmail: async ({ user, url }) => { /* Resend */ },
    autoSignInAfterVerification: true,
  },
  magicLink: {
    enabled: true,
    sendMagicLink: async ({ email, url }) => { /* Resend */ },
    expiresIn: 60 * 10,  // 10 minutes
  },
  emailOTP: {
    enabled: true,
    otpLength: 6,
    expiresIn: 60 * 10,
  },

  // === OAuth providers ===
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
    // Microsoft and Apple: shipped as config templates, off by default (spec 1.5, 1.6)
    // The buyer enables them in the onboarding wizard by setting the env vars.
  },

  // === Sessions ===
  session: {
    expiresIn: 60 * 60 * 24 * 7,   // 7 days (spec 1.11)
    updateAge: 60 * 60 * 24,       // refresh once per day
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5,              // 5 minutes in-memory cache
    },
    storeSessionInDatabase: true,  // session also persisted to DB for revocation
  },

  // === Advanced ===
  advanced: {
    crossSubDomainCookies: {
      enabled: true,                // spec — needed for our subdomain deploy
      domains: [process.env.PARENT_DOMAIN],
    },
    defaultCookieAttributes: {
      sameSite: 'lax',
      secure: true,
      httpOnly: true,
    },
    useSecureCookies: process.env.NODE_ENV === 'production',
  },

  // === Rate limiting (spec 1.23) ===
  rateLimit: {
    enabled: true,
    storage: 'secondary-storage',  // Upstash Redis, configured via secondaryStorage
    customRules: {
      '/sign-in/email': { window: 60, max: 5 },
      '/two-factor/verify': { window: 60, max: 5 },
    },
  },

  // === Secondary storage — Upstash Redis ===
  // Used for session cache, rate limit, API key cache, login notifications.
  secondaryStorage: {
    get: async (key) => { /* Upstash Redis GET */ },
    set: async (key, value, ttl) => { /* Upstash Redis SETEX */ },
    delete: async (key) => { /* Upstash Redis DEL */ },
  },

  // === Plugins ===
  plugins: [
    // Org + RBAC (spec 2.1-2.20)
    organization({
      ac: accessControl,
      roles: ROLES,
      allowUserToCreateOrganization: true,  // tightened per buyer config
      organizationHooks,
    }),

    // Admin + impersonation (spec 2.19)
    admin({
      defaultRole: 'member',
      adminRoles: ['admin'],
    }),

    // API key (spec 7.5, 7.6) — the bridge to /api/v1
    apiKey({
      defaultPrefix: 'sk_live_',
      enableMetadata: true,
      enableSessionForAPIKeys: true,  // a key can "be" a session for the API
      apiKeyHeaders: ['x-api-key', 'authorization'],  // Bearer sk_live_...
      rateLimit: { enabled: true, timeWindow: 60_000, maxRequests: 100 },
    }),

    // 2FA TOTP (spec 1.8)
    twoFactor({
      issuer: 'DeesseJS',
    }),

    // Passkey WebAuthn (spec 1.9)
    passkey({
      rpName: 'DeesseJS',
      rpID: process.env.PARENT_DOMAIN,
      origin: process.env.NEXT_PUBLIC_APP_URL,
    }),
  ],

  // === Hooks ===
  databaseHooks,
})

export type Auth = typeof auth
```

## Drizzle adapter options

```ts
drizzleAdapter(db, {
  provider: 'pg',                    // 'pg' | 'mysql' | 'sqlite'
  usePlural: true,                   // tables are `users`, not `user`
  schema: { /* optional override */ },
  experimental: { joins: true },     // 2-3x perf, requires RQBv2 relations in our schema
})
```

| Option | Value | Why |
|---|---|---|
| `provider` | `'pg'` | We're Postgres-only in v1. |
| `usePlural` | `true` | Our naming convention is plural. Without this, we'd have to remap every table. |
| `experimental.joins` | `true` | 2-3x perf on `/get-session` and `/get-full-organization`. Requires the Drizzle relations (RQBv2) to be defined on the auth tables — done in `packages/database/src/relations.ts`. |
| `schema` | optional | Override the default table name mappings if our naming diverges. We don't override (we use plural). |

## Schema generation workflow

The Drizzle tables that Better Auth needs are **generated**, not hand-written:

```bash
# From packages/auth/
pnpm auth generate --output ../database/src/schema/auth/

# Or run from anywhere with the right CWD:
cd packages/auth && npx @better-auth/cli@latest generate --output ../database/src/schema/auth/
```

The generated files are committed to `packages/database/src/schema/auth/`:
- `auth-users.ts` — the `user` table
- `auth-sessions.ts` — the `session` table
- `auth-accounts.ts` — OAuth provider links
- `auth-verifications.ts` — magic link + email OTP + password reset tokens
- `auth-organizations.ts` — orgs (when org plugin enabled)
- `auth-members.ts` — user ↔ org with role
- `auth-invitations.ts` — pending invites
- `auth-apikeys.ts` — when API key plugin enabled

After generation, add the relations in `packages/database/src/relations.ts` (RQBv2). This is a **manual step** — the generator doesn't write relations.

When you bump Better Auth, re-run the generator and review the diff. The generated SQL is **committed**; the migration is created by `drizzle-kit generate` and committed separately.

## OAuth client configuration

Better Auth reads OAuth client IDs and secrets from env. The `.env.example` (in the buyer's project) ships the placeholders:

```bash
# Required
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# Optional (shipped as config templates, off by default — spec 1.5, 1.6)
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
APPLE_CLIENT_ID=
APPLE_CLIENT_SECRET=

# Required for prod
BETTER_AUTH_SECRET=           # openssl rand -base64 32
BETTER_AUTH_URL=https://...
PARENT_DOMAIN=example.com
NEXT_PUBLIC_APP_URL=https://app.example.com
```

Microsoft and Apple are configured in `socialProviders` but commented out. The buyer enables them in the onboarding wizard by setting the env vars and uncommenting the entries.

## The Hono handler — what gets mounted

```ts
// packages/auth/src/auth.ts — the handler Better Auth generates
export const auth = betterAuth({ /* ... */ })

// auth.handler is a Fetch API handler — mountable in Hono directly
// See packages/api/src/hono/mount-auth.ts for the wrapper
```

In `packages/api/src/hono/mount-auth.ts` (the consumer):

```ts
import { Hono } from 'hono'
import { auth } from '@deessejs/auth'
import { cors } from 'hono/cors'

const authApp = new Hono()

// CORS first, then the handler
authApp.use('/api/auth/*', cors({
  origin: process.env.NEXT_PUBLIC_APP_URL,
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['POST', 'GET', 'OPTIONS'],
  credentials: true,
}))

authApp.on(['POST', 'GET'], '/api/auth/*', (c) => auth.handler(c.req.raw))

export { authApp }
```

This is mounted in `packages/api/src/app.ts` as the first route in the Hono composition.

## Environment variables — full list

| Variable | Required | Purpose |
|---|---|---|
| `BETTER_AUTH_URL` | yes (prod) | The base URL of the auth handler. Used for OAuth callbacks. |
| `BETTER_AUTH_SECRET` | yes | Session secret. Generate with `openssl rand -base64 32`. |
| `NEXT_PUBLIC_APP_URL` | yes | The web app origin. Used for trusted origins and CORS. |
| `PARENT_DOMAIN` | yes (subdomain deploy) | The parent domain for cross-subdomain cookies (spec 1.11). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google OAuth | spec 1.3 |
| `GITHUB_CLIENT_ID` / `GITHUB_CLIENT_SECRET` | for GitHub OAuth | spec 1.4 |
| `MICROSOFT_CLIENT_ID` / `MICROSOFT_CLIENT_SECRET` | optional | spec 1.5 |
| `APPLE_CLIENT_ID` / `APPLE_CLIENT_SECRET` | optional | spec 1.6 |
| `RESEND_API_KEY` | yes (in prod) | For magic link, email verification, password reset, login notifications. Used by Better Auth hooks, not by Better Auth itself. |
| `UPSTASH_REDIS_REST_URL` / `UPSTASH_REDIS_REST_TOKEN` | yes (in prod) | For sessions, rate limit, API key cache. |

## What goes where — quick reference

| You want to... | Edit |
|---|---|
| Add a new OAuth provider | `src/plugins/oauth.ts` + add to `socialProviders` in `auth.ts` + add env vars to `.env.example` |
| Change session duration | `session.expiresIn` in `auth.ts` |
| Change rate limit on sign-in | `rateLimit.customRules['/sign-in/email']` in `auth.ts` |
| Add a new RBAC permission | `src/access-control.ts` (statements + roles), then re-run schema gen |
| Regenerate the auth schema after a plugin change | `pnpm auth generate --output ../database/src/schema/auth/`, then commit + `drizzle-kit generate` for the migration |
| Use the auth instance from `apps/web` | Import from `@deessejs/auth` (server) or create a client with `createAuthClient(...)` in `apps/web` |
