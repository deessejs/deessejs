# Better-Auth: Guide Overview

**Read this file first.** It documents locked-in decisions and the current state of the code. Any change to `packages/auth` or `packages/database/src/schema/auth.ts` must be consistent with these decisions.

---

## Locked-in Decisions

| Decision | Status | See |
|---|---|---|
| better-auth with drizzle-adapter + PostgreSQL | Locked | `setup.md` |
| **Single-tenant**: no organization plugin, no org schema, no org client | Locked | this file + code note below |
| Email via `@workspace/email` (Resend + console dev) | Locked | `email.md` |
| Session 7 days, `updateAge` 1 day | Locked | `session.md` |
| `emailAndPassword.requireEmailVerification: true` | Locked | `email.md` |
| `emailVerification.sendOnSignUp: true` (and `sendOnSignIn: true`) | Locked | `email.md` |
| `experimental.joins: true` | Locked | `setup.md` |
| `advanced.useSecureCookies = NODE_ENV === "production"` | Locked | `session.md`, `pitfalls.md` §4 |
| `trustedOrigins` localhost gated on `NODE_ENV === "development"` | Locked | `session.md`, `pitfalls.md` §5 |

**Sources:**
- Session defaults: [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options)
- Email verification: [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password)
- Drizzle adapter: [better-auth.com/docs/adapters/drizzle](https://better-auth.com/docs/adapters/drizzle)
- Organization plugin, **historical reference only** (not used in this repo): [better-auth.com/docs/plugins/organization](https://better-auth.com/docs/plugins/organization)

---

## Single-Tenant

This template intentionally does **not** use the organization plugin. There is exactly one user-owned workspace. Do not introduce `organization(...)`, `databaseHooks.session.create.before` for org auto-create, `organizationClient()`, `allowUserToCreateOrganization`, `requireEmailVerificationOnInvitation`, or any `useActiveOrganization` usage. The [`org.md`](./org.md) file is kept as a historical-only reference. It describes patterns that do not apply here.

---

## Code Structure

```
packages/auth/src/auth.ts             — better-auth config (SINGLE SOURCE OF TRUTH)
packages/database/src/schema/auth.ts   — drizzle tables + relations (CLI-generated)
packages/email/                       — email transport + transactional templates
```

**Rule:** all better-auth configuration lives in `packages/auth/src/auth.ts`. Never inline auth config in routes or components.

---

## Update Cycle

1. Read this file to verify the decision is locked in
2. Read the relevant thematic guide
3. Read `pitfalls.md` BEFORE implementing anything
4. Make the code change
5. If the fix/workaround is not in `pitfalls.md`, add it

---

## Guide Dependencies

```
index.md (you are here)
├── setup.md       — prerequisite for all changes
├── email.md       — requires pitfalls.md first for the fire-and-forget pattern
├── session.md     — standalone
├── client.md      — standalone (no #9710 workaround applies — single-tenant has no $activeOrgSignal)
├── hooks.md       — standalone (databaseHooks patterns are still valid for non-org use cases)
└── pitfalls.md    — read BEFORE any implementation
```

> Hono-specific integration (handler mount, CORS, session middleware, typed env) lives at
> [`docs/engineering/architecture/knowledge-base/better-auth/hono-integration.md`](../../engineering/architecture/knowledge-base/better-auth/hono-integration.md). It's a study of a better-auth + Hono cross-cutting pattern, not a better-auth guide proper. <!-- vale fix: Microsoft.Contractions -->

> `org.md` is historical reference only (single-tenant); no longer in the read path.

---

## Code State (verified 2026-07-28)

- `auth.ts` (`packages/auth/src/auth.ts:64`): wires only `nextCookies()`. The codebase doesn't include an `organization(...)` plugin and has no `databaseHooks`. <!-- vale fix: write-good.Passive -->
- `schema/auth.ts`: `pnpm auth:generate` generates it. Drizzle relations defined for `experimental.joins`.
- Email verification: `requireEmailVerification: true`, `sendOnSignUp: true`, `sendOnSignIn: true` (auth.ts:24-48).
- `apps/app/proxy.ts` gates unverified users on protected prefixes and redirects them to `/verify-email`.
- The team closed the `@better-auth/cli` legacy / version-mismatch blocker. `auth` ships with `better-auth@^1.6.23` (same release line as runtime and adapter). <!-- vale fix: write-good.Passive -->

### Past tracked bugs <!-- vale fix: write-good.TooWordy -->

Both [#9070](https://github.com/better-auth/better-auth/issues/9070) (`session.create.before`) and [#9710](https://github.com/better-auth/better-auth/issues/9710) (`useActiveOrganization` stale) got tracked here because the organization plugin used both. This repo is single-tenant, so neither bug applies: the client doesn't wire `organizationClient()`, and `databaseHooks.session.create.before` doesn't run in production. Review upstream fixes (when they land) out of curiosity only. <!-- vale fix: write-good.Passive -->
