# Better-Auth: Known Pitfalls

**Read this before any implementation.** These are behavioral bugs, non-obvious defaults, and gotchas that have caused issues in this repo.

> **Single-tenant reminder:** this template doesn't use the organization plugin. Pitfalls historically tracked here for org-related behaviour (`autoCreateOrganizationOnSignUp`, `session.create.before` org autocreate, `useActiveOrganization` stale cache) are no longer in this file; [`org.md`](./org.md) documents them (historical only). They don't apply here. <!-- vale fix: write-good.Passive, Microsoft.Contractions, Microsoft.Auto -->

---

## 1. `advanced.useSecureCookies: true` Breaks Local Dev

Setting `useSecureCookies: true` forces the `Secure` cookie attribute in **all environments**, including `NODE_ENV=development`. Without HTTPS in local dev, cookies are silently rejected by the browser and sessions never work.

**Current state in this repo (verified 2026-07-28):** guarded on `NODE_ENV` at `packages/auth/src/auth.ts:55-57`. Production HTTPS still gets `Secure`; local HTTP does not. Local onboarding works on plain `http://localhost:3000`.

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies), "cookies are secure only in production by default."

---

## 2. `localhost` in `trustedOrigins` Risks Prod Leak

`trustedOrigins` once included hardcoded `http://localhost:3000` and `http://localhost:3001` regardless of environment. The CSRF / callback gates in Better Auth 1.6.x delegate to whatever list they receive. In a self-hosted / Codespaces / on-prem deploy that exposes `localhost`, a cyberattacker reaching those URLs could pass the CSRF check. <!-- vale fix: write-good.TooWordy, Microsoft.Militaristic -->

**Current state in this repo (verified 2026-07-28):** gated on `NODE_ENV` at `packages/auth/src/auth.ts:12-17`. The localhost entries are only spread when `NODE_ENV === "development"`.

```ts
trustedOrigins: [
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...serverEnv.ALLOWED_ORIGINS,
],
```

**Source:** [Better-Auth docs/reference/options](https://better-auth.com/docs/reference/options), `trustedOrigins` config.

---

## 3. `sendOnSignUp` Must Be Explicit When `requireEmailVerification: true`

Setting `emailAndPassword.requireEmailVerification: true` **without** also setting `emailVerification.sendOnSignUp: true` leaves the verification email gated only on the `undefined` default behavior, which can be brittle across Better Auth upgrades (the semantic of "absent + `requireEmailVerification`" has changed between minor versions).

**Current state in this repo (verified 2026-07-28):** both `sendOnSignUp: true` and `sendOnSignIn: true` are explicit at `packages/auth/src/auth.ts:38-39`. `apps/app/proxy.ts` redirects unverified users on protected prefixes (`/home`, `/settings`) to `/verify-email`.

**If you ever need to bypass verification during development**, do not comment these lines out. Set `emailAndPassword.requireEmailVerification: false` temporarily and revert before commit. Do not change `sendOnSignUp` back to `false` (or `undefined`-implicit) as a "shortcut".

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password), `sendOnSignUp`, `sendOnSignIn` options.

---

## 4. Auth middleware Throws Plain `Error`, Not `ORPCError`

In `packages/api/src/router/auth-middleware.ts`:

```ts
throw new Error("Authentication required")
```

oRPC's error handling may not map a plain `Error` to the correct HTTP status code. The correct throw should be:

```ts
import { ORPCError } from "@orpc/server"
throw new ORPCError({ code: "UNAUTHORIZED", message: "Authentication required" })
```

The team tracks this as a minor issue since oRPC may still surface the message, but the status code may be wrong (500 instead of 401). <!-- vale fix: write-good.Passive -->

---

## 5. Fixed `baseURL` Breaks Vercel Preview Deployments

A single fixed `baseURL` (e.g. `serverEnv.BETTER_AUTH_URL`) is captured at construction time. On a Vercel preview deployment (`<app>-git-<branch>-<user>.vercel.app`), the preview origin is neither the configured `baseURL` nor in the explicit `trustedOrigins` list, so the handler rejects every request with `Invalid Origin`. Even when a request slips through, the URLs Better Auth generates for reset-password, verify-email, and the device-flow are baked with the prod `baseURL`, so the user lands on `app.deessejs.com` instead of the preview host.

**Current state in this repo (verified 2026-09-01):** `packages/auth/src/auth.ts:81-92` configures `baseURL` as `{ allowedHosts, protocol, fallback }`. `allowedHosts` is built from `PRODUCTION_ALLOWED_HOSTS` (`app.deessejs.com`, `deessejs.com`, `docs.deessejs.com`, `*.deessejs.com`, `*.vercel.app`) plus `DEV_ALLOWED_HOSTS` (`localhost:*`) when `NODE_ENV === "development"`. The wildcard `*.vercel.app` covers every preview URL without per-preview env configuration; `*.deessejs.com` covers any future subdomain (e.g. `api.deessejs.com`) without an allowlist edit; `localhost:*` matches any local port so the CLI and apps on non-default ports work. `protocol` is `"http"` in dev, `"https"` otherwise. `fallback` is the prod origin (`https://app.deessejs.com`) in prod and `http://localhost:3000` in dev. The previous `trustedOrigins` spread that re-derived the prod origins from `WEB_URL`/`APP_URL`/`DOCS_URL` is gone — Better Auth auto-adds each `allowedHosts` entry to `trustedOrigins` (with both `http` and `https` for localhost). `ALLOWED_ORIGINS` remains for ad-hoc extras (staging, partner origins).

**Why `fallback` is set** (deviates from the doc's "safer default" recommendation): production requests always arrive with a `host` header (Vercel proxies set it), so the fallback never resolves a real request. It only kicks in for (a) in-process Hono requests that omit the host header (e.g. tests calling `api.request("/...")` directly, or any future internal handler that calls `auth.api.X()` without forwarding `c.req.raw.headers`), and (b) misconfigured reverse proxies that strip `host` upstream. In both cases returning a canonical prod origin is strictly better than a 500. Do NOT rely on the fallback for normal request handling — the per-request `host` header is the source of truth.

The pre-existing `serverEnv.BETTER_AUTH_URL` env field is kept for tooling (`drizzle-kit`, scripts) but is no longer read by the auth handler. Do not remove it from the env schema as part of an unrelated PR.

**Source:** [better-auth.com/docs/guides/dynamic-base-url](https://better-auth.com/docs/guides/dynamic-base-url), [better-auth#2203](https://github.com/better-auth/better-auth/issues/2203) (initial report, workarounds), [better-auth#8009](https://github.com/better-auth/better-auth/commit/197792318) (introduced `allowedHosts`).
