# Better Auth

## Decision

**Better Auth** as the authentication, organization, and authorization platform for every Next.js app that has users.

We use Better Auth **plus a curated set of plugins** (currently 8 official plugins). The auth module composes these plugins; it does not reinvent them.

- **Decision date:** 2026-06-17
- **Decision owner:** tech lead
- **Status:** Locked

## Scope

The `auth/` module owns the entire user-management platform:

- Sign-up, sign-in, sign-out, sessions.
- Multi-org per user, org switching, invitations, RBAC.
- Admin (impersonation, user management, audit).
- API keys (for the public REST API and CLI).
- 2FA, passkeys, magic links, OAuth, captcha.
- Subscription billing (via the Stripe plugin).
- SSO/SAML (optional, v1 ships configured but not enabled by default).

**`auth/` is the largest feature module in the codebase.** Not "auth" in the narrow sense — it's the user + org + billing + access platform. See [`../05-modular-contract/module-structure.md`](../05-modular-contract/module-structure.md) for the full anatomy of this special module.

## Plugins we compose

The `auth/` module enables these official Better Auth plugins by default. The buyer can disable any of them in `config.ts`.

| Plugin | Purpose | Spec coverage |
|---|---|---|
| `organization` | Multi-org, members, invitations, RBAC | Features 2.1-2.24 |
| `admin` | Impersonation, user list, audit, IP controls | Features 2.19-2.22, 1.24 |
| `api-key` | API keys for public REST API + CLI | Feature 1.18 |
| `passkey` | WebAuthn / passkeys | Feature 1.9 |
| `two-factor` | TOTP 2FA | Feature 1.8 |
| `magic-link` | Passwordless email sign-in | Feature 1.2 |
| `generic-oauth` | OAuth providers (Google, GitHub, MS, Apple) | Features 1.3-1.6 |
| `stripe` | Subscriptions, plans, webhooks, customer portal | Features 3.1-3.4, 3.6, 3.7, 3.13-3.15, 3.17 |
| `captcha` | Cloudflare Turnstile on sign-up | Feature 1.22 |
| `sso` | SAML 2.0 SSO (configured, off by default) | Feature 1.7 (Enterprise opt-in) |

Plugins NOT enabled by default (buyer can opt in):

- `jwt` — for service-to-service auth. We use API keys instead.
- `oauth-proxy` — only needed for cross-domain OAuth flows.
- `bearer` — used internally by Better Auth; no buyer config needed.
- `one-time-token` — internal use.
- `phone-number` — not in v1 spec.
- `email-otp` — alternative to magic-link; we ship magic-link.
- `siwe` (Sign In With Ethereum) — v2.
- `agent-auth` (new) — for AI agents. v2.
- `scim` — Enterprise provisioning. v2.

## What this gives us

1. **The org + admin + Stripe plugin trio** covers ~80% of our `features/01`, `features/02`, and `features/03` specs out of the box. We don't build them.
2. **Per-plugin composition.** The buyer disables plugins they don't want via `auth/config.ts`. The modular contract applies at the plugin level too.
3. **Schema generation via `@better-auth/cli`.** Schemas are owned by Better Auth. We don't hand-edit generated tables.
4. **Drizzle adapter.** Better Auth reads/writes via our Drizzle client — no separate DB layer.
5. **Multi-tenant billing via `customerType: 'organization'`.** Subscriptions link to orgs, not users. Aligns with our RBAC model.
6. **Trial abuse prevention.** One trial per account across all plans. Built-in.
7. **Webhook handlers for the full subscription lifecycle.** Subscription created/updated/cancelled/deleted via Stripe webhooks.

## Architecture

```
User/Browser
   │
   ▼
Next.js app (apps/template/apps/web/)
   │
   ├── auth.api.*  ──→  Better Auth core (apps/template/packages/auth/)
   │                        │
   │                        ├── organization plugin  ──→  Drizzle (orgs, members, invitations)
   │                        ├── admin plugin         ──→  Drizzle (impersonation, audit)
   │                        ├── api-key plugin       ──→  Drizzle (api_keys)
   │                        ├── passkey plugin       ──→  Drizzle (passkey_credentials)
   │                        ├── two-factor plugin    ──→  Drizzle (two_factor)
   │                        ├── stripe plugin        ──→  Stripe API + Drizzle (subscription table)
   │                        ├── generic-oauth plugin ──→  OAuth providers (Google, GitHub, etc.)
   │                        ├── magic-link plugin    ──→  Resend (email delivery)
   │                        ├── captcha plugin       ──→  Cloudflare Turnstile
   │                        └── sso plugin           ──→  SAML IdPs (Enterprise)
   │
   ├── billing.api.* ──→  Custom billing wrapper (apps/template/packages/billing/)
   │                         │
   │                         ├── Usage-based metering (Upstash + Stripe metered)
   │                         ├── Revenue reporting
   │                         └── Custom refund flow
   │
   └── Better Auth CLI (@better-auth/cli)
        │
        └── Generates / migrates Drizzle schemas from Better Auth config
```

The `auth/` module exposes one `auth` object (configured Better Auth instance). The app imports `auth.api.<procedure>` to call auth from server code, and uses Better Auth's React hooks for client-side session.

## The Stripe plugin specifically

The `@better-auth/stripe` plugin handles the full subscription lifecycle through hooks:

- `onSubscriptionComplete` — checkout-created
- `onSubscriptionCreated` — created outside checkout
- `onSubscriptionUpdate` — any update
- `onSubscriptionCancel` — cancellation requested
- `onSubscriptionDeleted` — fully deleted
- `onTrialStart` / `onTrialEnd` / `onTrialExpired`

The plugin supports two billing models:

- `customerType: 'user'` — billing entity is the user.
- `customerType: 'organization'` — billing entity is the org (chosen; matches our RBAC).

Subscription management methods exposed by the plugin:

- `subscription.upgrade` — create or switch plans (immediate or scheduled).
- `subscription.list` — list active subscriptions for a user or org.
- `subscription.cancel` — cancel via Stripe Billing Portal.
- `subscription.restore` — undo pending cancellation.
- `subscription.billingPortal` — create a self-service portal session.

The plugin adds a `subscription` table to our Drizzle schema (auto-generated by the CLI).

**Webhook endpoint:** `https://<buyer-domain>/api/auth/stripe/webhook`. Signature verification is handled internally.

## Customization: disabling plugins

The buyer can disable any plugin via `auth/config.ts`:

```ts
// apps/template/packages/auth/config.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  // ... core config
  plugins: [
    organization(),
    admin(),
    apiKey(),
    passkey(),
    twoFactor(),
    magicLink({ sendMagicLink: sendViaResend }),
    genericOAuth({ providers: [...] }),
    stripe({ ... }),
    // captcha() — comment out to disable
    // sso() — uncomment for Enterprise
  ],
});
```

Commenting out a plugin removes its functionality AND its generated schema tables (after running `better-auth migrate`).

## Why Better Auth + plugins (vs building from scratch)

| Trade-off | Build from scratch | Better Auth + plugins |
|---|---|---|
| Time to "feature complete" | 4-6 months | 0 (already there) |
| Maintenance burden | We own every fix | Plugin maintainers + us |
| Customization | Total freedom | Plugin boundaries |
| Per-tenant orgs | Build from scratch | One plugin config |
| RBAC depth | Build from scratch | Built-in (custom roles, fine-grained) |
| Stripe integration | Build from scratch | One plugin config |
| Bug risk | We catch everything | Vendor catches most, we catch the rest |

The "Apple" positioning argues for **shipping a feature-complete stack** rather than building each piece. Better Auth + plugins is the path to that.

## Why not Clerk or WorkOS

| Alternative | Why not |
|---|---|
| **Clerk** | Hosted, vendor lock-in, per-user monthly cost. Doesn't fit the self-host template promise. |
| **WorkOS** | Enterprise SSO focus. Overkill for v1; Better Auth's `sso` plugin handles the same case if needed. |
| **Supabase Auth** | Tied to Supabase as a backend. We're Postgres-agnostic. |

Better Auth + plugins is the only option that:
- Is self-hosted by default.
- Doesn't charge per user.
- Ships with orgs + admin + Stripe built-in.
- Lets us swap providers (Google → MS) via plugin config, not code.

## Constraints

- **All auth-related code lives in `apps/template/packages/auth/`.** No direct calls to Better Auth plugins from feature modules.
- **All auth-related schemas are generated by `@better-auth/cli`.** Don't hand-edit them.
- **No client-side auth checks.** All auth checks are server-side via `auth.api` in Server Components, server actions, or oRPC procedures.
- **Sessions in Upstash Redis.** Not in cookies, not in JWT-only mode.
- **Audit log every auth event.** Sign-in, sign-out, password change, API key creation, role change, impersonation.
- **Trial abuse prevention is enabled** (`disableTrial: false` is the default).

## What the buyer can replace

The buyer can replace Better Auth entirely (rare, but possible) by:

1. Deleting `apps/template/packages/auth/`.
2. Replacing with their own auth implementation that conforms to the `auth.api` shape.
3. Removing Better Auth plugins from `package.json` and running `pnpm install`.

Most buyers will keep Better Auth and just customize the plugin configuration.

## Cross-references

- [`../05-modular-contract/module-structure.md`](../05-modular-contract/module-structure.md) — the canonical tree of a feature module (auth is a special case with plugins).
- [`../05-modular-contract/feature-template.md`](../05-modular-contract/feature-template.md) — how to add a new feature, with auth as the example.
- [`../05-modular-contract/delete-tests.md`](../05-modular-contract/delete-tests.md) — the delete test handles plugin removal.
- [`../10-decisions/0005-better-auth.md`](../10-decisions/) — the ADR (when written).
- [`./stripe.md`](./stripe.md) — direct Stripe usage (the part not covered by the Stripe plugin).
- [`./resend-react-email.md`](./resend-react-email.md) — magic-link delivery via Resend.
- [`./upstash-redis-realtime.md`](./upstash-redis-realtime.md) — rate-limit plugin backend.
- [`../../product/features/01-auth-and-identity.md`](../../product/features/01-auth-and-identity.md) — the auth feature inventory.
- [`../../product/features/02-orgs-and-rbac.md`](../../product/features/02-orgs-and-rbac.md) — orgs and RBAC inventory.
- [`../../product/features/03-billing.md`](../../product/features/03-billing.md) — billing inventory (most covered by Stripe plugin).
