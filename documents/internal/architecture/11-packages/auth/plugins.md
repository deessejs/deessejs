# Plugins — what's enabled in v1, and why

The plugin stack is the visible surface of `packages/auth`. Every enabled plugin maps to a spec feature; every disabled plugin has a documented reason.

## Quick reference

| Plugin | Package | Spec | v1 |
|---|---|---|---|
| `organization()` | `better-auth/plugins` | 2.1-2.20 | ✅ ON |
| `admin()` | `better-auth/plugins` | 2.19, 2.20 | ✅ ON |
| `apiKey()` | `@better-auth/api-key` | 7.5, 7.6 | ✅ ON |
| `twoFactor()` | `better-auth/plugins` | 1.8 | ✅ ON |
| `passkey()` | `better-auth/plugins` | 1.9 | ✅ ON |
| `magicLink()` | `better-auth/plugins` | 1.2 | ✅ ON |
| `emailOtp()` | `better-auth/plugins` | 1.14, 1.15 | ✅ ON |
| OAuth Google | `socialProviders.google` | 1.3 | ✅ ON |
| OAuth GitHub | `socialProviders.github` | 1.4 | ✅ ON |
| OAuth Microsoft | `socialProviders.microsoft` | 1.5 | 🟡 config template, off by default |
| OAuth Apple | `socialProviders.apple` | 1.6 | 🟡 config template, off by default |
| SAML SSO | (Better Auth does not provide in core) | 1.7 | ⚪ v2 — buyer adds via Better Auth plugin or custom |
| Service accounts | (not a separate plugin — `apiKey()` org-owned suffices) | 1.19 | 🔵 v2 |
| Captcha (Turnstile) | `better-auth/plugins` (captcha) | 1.22 | ✅ ON |
| Rate limit auth endpoints | built into `betterAuth({ rateLimit })` | 1.23 | ✅ ON |
| Audit log | custom `databaseHooks` | 1.24 | ✅ ON (custom, not a plugin) |
| Account merge | custom `databaseHooks` | 1.21 | ✅ ON (custom) |
| Account deletion | custom `databaseHooks` | 1.20 | ✅ ON (custom) |

## `organization()` — multi-tenant core (spec 2.1-2.20)

The single most important plugin. Provides:

- **Multi-org per user** (spec 2.1) — a user can belong to many orgs with different roles in each.
- **Org switcher** via `session.activeOrganizationId` (spec 2.3) — the client sets it; Better Auth stores it in the session.
- **Invitations** by email (spec 2.4) — accept / decline flow, expiry, revocation.
- **Member list** with role + invitation status (spec 2.5).
- **Custom roles + permissions** via `createAccessControl(...)` (spec 2.13, 2.14, 2.15). We define `STATEMENTS` and `ROLES` in `src/access-control.ts` and pass them in.
- **Predefined roles**: `owner`, `admin`, `member`, `billing` (per spec 2.13). Custom roles are also supported (spec 2.14).

What it does **not** provide (and we implement via `organizationHooks` or `databaseHooks`):

- **Org deletion with grace period** (spec 2.8) — we implement via `organizationHooks.beforeDeleteOrganization` + a `deletedAt` column + a job.
- **Org transfer** (spec 2.9) — custom flow.
- **IP whitelist / blacklist** (spec 2.21, 2.22) — custom hooks.
- **GDPR data export / deletion** (spec 2.24) — custom hooks + a job.
- **Sub-orgs / teams within orgs** (spec 2.11) — not in v1. The plugin has a `team` feature but we don't ship it in v1.

## `admin()` — global operator surface (spec 2.19, 2.20)

The admin plugin operates on the `user` table (GLOBAL scope — across all orgs, across all sessions). One-paragraph summary here; full deep dive in [`admin.md`](./admin.md). Impersonation has its own doc at [`impersonation.md`](./impersonation.md).

- **List / create / update / remove users** — `listUsers`, `createUser`, `updateUser`, `removeUser` on the global user table.
- **Ban / unban** — sets `user.banned = true`, blocks sign-in. Optional expiry via `banExpiresIn`.
- **Set / unset role** — changes `user.role` (GLOBAL, single string column). The roles here are `admin` (operator) and `member` (default). Distinct from org plugin's `member.role` — see below.
- **Impersonate** — `impersonateUser` creates a new session for the target user with `session.impersonatedBy = <adminId>`. See [`impersonation.md`](./impersonation.md).
- **Session management** — `listUserSessions`, `revokeUserSession`, `revokeUserSessions`.

**Critical distinction — `user.role` vs `member.role`** :

| Field | Plugin | Scope | Where it lives |
|---|---|---|---|
| `user.role` | `admin()` | GLOBAL — applies across all orgs | `users` table, single string column |
| `member.role` | `organization()` | ORG-SCOPED — applies within one org | `members` table, one row per (user, org) pair |

`adminRoles: ['admin']` matches `user.role === 'admin'`. Promoting a user to global admin is rare and powerful — they can ban any user, impersonate any non-admin, see every org. The org plugin's `'admin'` role on `member.role` is the everyday "admin of one org" — different field, different blast radius.

UI must label both clearly. A user detail page should show **Global role** (from `user.role`) and **Org memberships** (each with its own `member.role`). See [`admin.md`](./admin.md) § 6 for the decision tree.

**Configuration** (in `auth.ts`) :

```ts
admin({
  defaultRole: 'member',      // role assigned to a newly-created user
  adminRoles: ['admin'],      // which user.role values grant admin access
})
```

No `ac` / `roles` passed — the plugin uses the built-in statements (`user`, `session`). Rationale in [`decisions/0002-admin-plugin-config.md`](./decisions/0002-admin-plugin-config.md).

**Breaking change to track** : PR #6454 (`feat(admin): prevent impersonating admins by default`) — admins can no longer impersonate other admins unless explicitly allowed via the `impersonate-admins` permission. **Improvement, but must be acted on** if any future code path assumes admin-can-impersonate-admin.

## `apiKey()` — the bridge to /api/v1 (spec 7.5, 7.6)

Critical. See [`api-keys.md`](./api-keys.md) for the full flow.

- **User-bound and org-bound keys** — perfect for our multi-tenant.
- **Built-in rate limiting** per key (spec 7.6).
- **Prefix** — `sk_live_<24 chars>` style, configurable.
- **Metadata** — JSON for buyer use.
- **Expiration + refill** — for usage-based billing patterns.
- **Permissions (scopes)** — `Record<string, string[]>` per key, enforced at `verifyApiKey()` time.
- **Secondary storage** — the key lookup hits Upstash Redis first, DB on miss.
- **Sessions from API keys** — a key can be "elevated" to a session for the API surface, so procedures don't need to know if they were called from a cookie or a key.

## `twoFactor()` — TOTP (spec 1.8)

TOTP only. Backup codes are generated automatically. Issuer is `DeesseJS`. Recovery flow via the `emailOtp` plugin.

## `passkey()` — WebAuthn (spec 1.9)

WebAuthn credentials. RP ID = parent domain. Origin = the app URL. Recovery flow is the same as 2FA — the user can disable 2FA via email OTP if they lose their authenticator.

## `magicLink()` + `emailOtp()` — email flows (spec 1.2, 1.14, 1.15)

- **`magicLink`** — sign-in via one-time link. Used for passwordless sign-in (spec 1.2).
- **`emailOtp`** — used for email verification (spec 1.14), password reset (spec 1.15), and as a recovery factor for 2FA / passkey.

Both use Resend (via our `mail` package). Better Auth calls `sendMagicLink`, `sendVerificationEmail`, `sendResetPassword` as hooks — we wire those to the Resend adapter.

## OAuth providers (spec 1.3, 1.4, 1.5, 1.6)

- **Google** (spec 1.3) — ON by default. The most-used provider.
- **GitHub** (spec 1.4) — ON by default. The dev audience expects it.
- **Microsoft** (spec 1.5) — config template, off by default. Enterprise buyers ask for it. The buyer enables in the onboarding wizard by setting the env vars.
- **Apple** (spec 1.6) — config template, off by default. iOS-facing buyers ask for it. Same as Microsoft — wizard enable.

**SAML SSO (spec 1.7)** : not in v1. Better Auth does not ship SAML in core. The buyer can add a SAML plugin from Better Auth's ecosystem or roll their own. Documented as a buyer-implementable extension.

## Captcha / bot protection (spec 1.22)

`better-auth/plugins` includes a captcha plugin that supports Cloudflare Turnstile. Free, easy, and the spec calls for it. Configured with `TURNSTILE_SITE_KEY` and `TURNSTILE_SECRET_KEY` env vars.

## Rate limiting on auth endpoints (spec 1.23)

Built into `betterAuth({ rateLimit: { ... } })`. Backed by `secondaryStorage` (Upstash Redis). Custom rules per endpoint:

```ts
rateLimit: {
  enabled: true,
  storage: 'secondary-storage',
  customRules: {
    '/sign-in/email': { window: 60, max: 5 },     // 5 attempts per minute
    '/sign-up/email': { window: 60, max: 3 },    // 3 signups per minute per IP
    '/two-factor/verify': { window: 60, max: 5 },
    '/forget-password': { window: 60, max: 3 },
  },
},
```

## Audit log (spec 1.24)

**Not a plugin** — implemented via `databaseHooks`. Every auth event (sign-in, sign-out, password change, API key creation, role change, impersonation) calls our hook, which writes to a `auditLog` table. See `hooks/database-hooks.ts`.

## Account merge (spec 1.21)

When a user signs in with Google and is already registered via email, Better Auth can link the accounts via `accountLinking` config:

```ts
account: {
  accountLinking: {
    enabled: true,
    trustedProviders: ['google', 'github'],
  },
},
```

The merge logic is Better Auth's; we customize the user-facing flow via `databaseHooks` to confirm the merge with the user.

## Account deletion (spec 1.20)

A `deleteUser` flow is part of Better Auth's `admin` plugin (admin-initiated) and the user-initiated flow is a custom endpoint we build. GDPR alignment is enforced by:
- Soft-delete (we add a `deletedAt` column to `user`)
- 30-day grace period (custom logic)
- Hard-delete job (Trigger.dev)
- Resend unsubscribe + audit log entry

## What we don't enable in v1

- **`oidcProvider` / `mcp`** — deprecated by Better Auth, will be removed in 1.7. Don't use.
- **`oauth-proxy`** — needed only for local dev OAuth callbacks. We enable it in dev only.
- **SAML SSO** (spec 1.7) — not in $299-999 band. Buyer adds it.
- **Service accounts** (spec 1.19) — `apiKey()` with `references: 'organization'` covers most use cases. v2 candidate.
- **Sub-orgs / teams** (spec 2.11) — the `team` feature of the org plugin. v2 candidate.

## How plugins are wired in `auth.ts`

```ts
import { organization, admin, twoFactor, passkey, magicLink, emailOtp, captcha } from 'better-auth/plugins'
import { apiKey } from '@better-auth/api-key'

export const auth = betterAuth({
  // ...base config...
  plugins: [
    organization({ ac, roles, organizationHooks }),
    admin({ defaultRole: 'member', adminRoles: ['admin'] }),
    apiKey({ defaultPrefix: 'sk_live_', /* ... */ }),
    twoFactor({ issuer: 'DeesseJS' }),
    passkey({ rpName: 'DeesseJS', /* ... */ }),
    captcha({ provider: 'cloudflare-turnstile' }),
  ],
})
```

Order doesn't matter (Better Auth handles plugin resolution internally), but the conventional order in the file is **base config first, then auth-related plugins (org, admin, 2FA, passkey), then API surface plugins (apiKey)**.
