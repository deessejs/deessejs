# @workspace/auth

## 0.1.0

### Minor Changes

- 8bc8916: ADR-022: documents two gaps in the ADR-020 device-auth flow surfaced during the staging smoke after the staging-to-main promotion. First, the CLI's `deesse auth login` succeeds end-to-end but writes `user.id = ""` to `~/.deessejs/auth.json` (the user sees `logged in as unknown user` and `auth status` reports "session invalid"): `fetchUserIdentity` calls `authClient.getSession()` without an `Authorization` header, and the server does not register the `bearer()` plugin that would make the header resolvable. Second, the web verification page `/device` has no sign-in gate: the proxy's `config.matcher` does not include `/device` (the bounce branch is dead code), and the page itself does not check the session before rendering the Approve/Deny buttons, so a user who lands there while anonymous clicks Approve and gets HTTP 401 from Better Auth.

  The ADR explains both root causes, references the canonical Better Auth patterns and the production comparison (Vercel, GitHub, Microsoft, Auth0, Google device flow), and pins the implementation path: wire `bearerFetch` into `fetchUserIdentity` (replace the `?? { id: "" }` fallback with a hard `cli_device_expired` throw), register `bearer()` in `packages/auth/src/auth.ts` between `deviceAuthorization` and `nextCookies`, and add a server-side session check + redirect to `/login?redirect=/device?user_code=...` in the device page Server Component, plus adding `/device` to the proxy's `config.matcher`.

  This PR ships the ADR and the docs index entry only. The implementation lands in a follow-up PR; this changeset declares the upcoming minor bumps on `@deessejs/cli` and `@workspace/auth` so reviewers understand the lineage and the release pipeline can attribute the bump correctly.

### Patch Changes

- ac69a68: Implements ADR-023: session-aware header for `apps/web`.

  Anonymous visitors on the marketing site now see `Log in` and `Sign up` buttons in the header (linking cross-app to `apps/app`'s auth pages).
  Authenticated visitors see an avatar dropdown with `Dashboard` and `Sign out` (with a confirmation dialog).
  The right-side `Coming soon` placeholder on both desktop and mobile is gone.

  User-visible:

  - The desktop header right cluster on every public page of `deessejs.com` now renders either two CTA buttons (anonymous) or an avatar trigger (authenticated), instead of the disabled `Coming soon` button.
  - The mobile Sheet footer renders the same control set, adapted to a stacked layout with full-width buttons.
  - Clicking `Sign out` from the avatar dropdown opens a confirmation dialog.
    Confirming signs the user out via `authClient.signOut()` and redirects to `app.deessejs.com/login` with a full page reload, so the next paint shows the anonymous CTA set.

  API surface:

  - `@workspace/env` gains `PARENT_DOMAIN: z.string().min(1).optional()` in `serverInputShape`, materialised in `serverEnv`.
    The production gate in `serverSchema.superRefine` fails when `PARENT_DOMAIN` is undefined under `NODE_ENV=production`, so `packages/auth` cannot enable cross-subdomain cookies without an explicit value.
  - `@workspace/auth` enables `crossSubDomainCookies: { enabled: true, domain: serverEnv.PARENT_DOMAIN }` and `defaultCookieAttributes: { sameSite: "none" }` in `packages/auth/src/auth.ts` when `PARENT_DOMAIN` is set.
    No-op in dev when the field is unset.
    The production `trustedOrigins` list is now derived from `serverEnv.WEB_URL`, `APP_URL`, and `DOCS_URL` (each normalised through `new URL(x).origin`), so adding a new deployed origin only requires updating the URL fields, not this file.
  - `apps/web` gains `apps/web/src/lib/auth-client.ts`, which instantiates `createAuthClient` from `better-auth/react` with `baseURL: clientEnv.NEXT_PUBLIC_API_BASE_URL` and `basePath: API_AUTH_PATH` (imported from `@workspace/api/base-path`, the subpath).
    The barrel `@workspace/api` is not imported because it would drag `@workspace/auth` into the client bundle.
  - `apps/web/src/components/headers/user-menu.tsx` is the new client component mounted by `SiteHeader` in both desktop and mobile slots.
    Pure helpers `getInitials` and `getAvatarUrl` are extracted into `user-menu-helpers.ts` for unit testing.
  - `apps/web/next.config.ts` adds `vercel.com/api/www/avatar` to `images.remotePatterns` and the matching `dangerouslyAllowSVG` / `dangerouslyAllowLocalIP` flags, mirroring `apps/app/next.config.ts`.

  Vercel env (operational, no code change):

  - Set `PARENT_DOMAIN=deessejs.com` on `apps/app`'s Vercel project for production.
    Without it, the env schema gate fails at startup and the auth client never resolves a session on `apps/web`.
  - Confirm `ALLOWED_ORIGINS` on `apps/app`'s Vercel project already includes `https://deessejs.com` (mandated by ADR-021 for the templates fetch; the same value now also covers the credentialed auth-client `get-session` fetch).

- Updated dependencies [ac69a68]
- Updated dependencies [af040af]
  - @workspace/env@0.0.1
  - @workspace/database@0.0.2
  - @workspace/email@0.0.1

## 0.0.2

### Patch Changes

- Updated dependencies [83a37b0]
  - @workspace/database@0.0.1

## 0.0.1

### Patch Changes

- 03712ca: fix(auth): defense-in-depth against OAuth `callbackURL` open redirect ([CVE-2025-27143](https://github.com/better-auth/better-auth/security/advisories/GHSA-99p3-qfj2-3vp2)). The previous flow validated only the path component of `callbackURL`, allowing protocol-relative URLs (`//evil.com`) and backslash variants (`/\evil.com`) to bypass the check and redirect users to attacker-controlled hosts after sign-in. A new `safe-redirect` helper in `@workspace/utils` normalises any redirect target into a guaranteed-safe relative path, and `packages/auth/src/auth.ts` now calls it before forwarding to the OAuth provider. Test coverage for all four known bypass vectors.
