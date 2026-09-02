---
"web": patch
"@workspace/auth": patch
"@workspace/env": patch
---

Implements ADR-023: session-aware header for `apps/web`.

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
