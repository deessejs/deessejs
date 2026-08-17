# Better-Auth — Known Pitfalls

**Read this before any implementation.** These are behavioral bugs, non-obvious defaults, and gotchas that have caused issues in this repo.

> **Single-tenant reminder:** this template does not use the organization plugin. Pitfalls historically tracked here for org-related behaviour (`autoCreateOrganizationOnSignUp`, `session.create.before` org auto-create, `useActiveOrganization` stale cache) have been **removed** from this file and are documented in [`org.md`](./org.md) (historical only). They do not apply here.

---

## 1. `advanced.useSecureCookies: true` Breaks Local Dev

Setting `useSecureCookies: true` forces the `Secure` cookie attribute in **all environments**, including `NODE_ENV=development`. Without HTTPS in local dev, cookies are silently rejected by the browser and sessions never work.

**Current state in this repo (verified 2026-07-28):** guarded on `NODE_ENV` at `packages/auth/src/auth.ts:55-57`. Production HTTPS still gets `Secure`; local HTTP does not. Local onboarding works on plain `http://localhost:3000`.

**Source:** [better-auth.com/docs/concepts/cookies](https://better-auth.com/docs/concepts/cookies) — "cookies are secure only in production by default."

---

## 2. `localhost` in `trustedOrigins` Risks Prod Leak

`trustedOrigins` previously included hardcoded `http://localhost:3000` and `http://localhost:3001` regardless of environment. The CSRF / callback gates in Better Auth 1.6.x delegate to whatever list they receive — so in a self-hosted / Codespaces / on-prem deploy that exposes `localhost`, an attacker reaching those URLs could pass the CSRF check.

**Current state in this repo (verified 2026-07-28):** gated on `NODE_ENV` at `packages/auth/src/auth.ts:12-17`. The localhost entries are only spread when `NODE_ENV === "development"`.

```ts
trustedOrigins: [
  ...(process.env.NODE_ENV === "development"
    ? ["http://localhost:3000", "http://localhost:3001"]
    : []),
  ...serverEnv.ALLOWED_ORIGINS,
],
```

**Source:** [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `trustedOrigins` config.

---

## 3. `sendOnSignUp` Must Be Explicit When `requireEmailVerification: true`

Setting `emailAndPassword.requireEmailVerification: true` **without** also setting `emailVerification.sendOnSignUp: true` leaves the verification email gated only on the `undefined` default behavior, which can be brittle across Better Auth upgrades (the semantic of "absent + `requireEmailVerification`" has changed between minor versions).

**Current state in this repo (verified 2026-07-28):** both `sendOnSignUp: true` and `sendOnSignIn: true` are explicit at `packages/auth/src/auth.ts:38-39`. `apps/app/proxy.ts` redirects unverified users on protected prefixes (`/home`, `/settings`) to `/verify-email`.

**If you ever need to bypass verification during development**, do not comment these lines out — set `emailAndPassword.requireEmailVerification: false` temporarily and revert before commit. Do not change `sendOnSignUp` back to `false` (or `undefined`-implicit) as a "shortcut".

**Source:** [better-auth.com/docs/authentication/email-password](https://better-auth.com/docs/authentication/email-password) — `sendOnSignUp`, `sendOnSignIn` options.

---

## 4. Auth Middleware Throws Plain `Error`, Not `ORPCError`

In `packages/api/src/router/auth-middleware.ts`:

```ts
throw new Error("Authentication required")
```

oRPC's error handling may not map a plain `Error` to the correct HTTP status code. The correct throw should be:

```ts
import { ORPCError } from "@orpc/server"
throw new ORPCError({ code: "UNAUTHORIZED", message: "Authentication required" })
```

This is tracked as a minor issue since oRPC may still surface the message, but the status code may be wrong (500 instead of 401).

---

## 5. GitHub OAuth Specifics

When wiring `socialProviders.github`:

- **`scope` is an OAuth App concern, not a better-auth config field.** The required `user:email` scope is configured on the GitHub OAuth App side (Permissions and Events > Account permissions > Email addresses > Read-only). Adding `scope` to the `socialProviders.github` block duplicates upstream and drifts.
- **No refresh token.** GitHub does not issue refresh tokens for OAuth apps. Access tokens remain valid until the user or the app revokes them. The `account.refreshToken` column stays `NULL` for GitHub-linked accounts.
- **`accountLinking.trustedProviders: ["github"]`** lets a same-email GitHub sign-in auto-link to an existing email/password user. This is safe here because `emailAndPassword.requireEmailVerification: true` already gates sign-up on a verified email. Without that gate, switching `trustedProviders` on for a provider that does not verify emails would be an account-takeover risk.
- **`updateUserInfoOnLink: true`** copies the GitHub `name` and `image` onto the local user on each sign-in. The local `email` and `emailVerified` are never changed by the link — signing in with a new provider cannot rebind the account's identity.
- **`redirectPlugin` is NOT wired.** The comment at `apps/app/components/auth/oauth-buttons.tsx:32` previously claimed so; it does not. better-auth's default behaviour handles the post-`signIn.social` redirect to `callbackURL`. Adding the plugin on top is dead code. ADR-013 forbids wiring it.
- **`account.encryptOAuthTokens`** defaults to `false`. The GitHub `accessToken` persists in plaintext in the `account` table. Token encryption is a follow-up via `databaseHooks.account.create.before` and is not in scope for ADR-013.

**Source:** [better-auth.com/docs/authentication/github](https://better-auth.com/docs/authentication/github). [better-auth.com/docs/concepts/users-accounts](https://better-auth.com/docs/concepts/users-accounts) — `updateUserInfoOnLink`. [better-auth.com/docs/reference/options](https://better-auth.com/docs/reference/options) — `account.encryptOAuthTokens`.
