# app

## 0.2.0

### Minor Changes

- 4df3461: Adds the device authorization verification surface on the web side (ADR-020), the consumer-facing counterpart to the CLI's `deesse auth login`.

  - New page at `/(unprotected)/(auth)/device` — a thin Server Component that reads `user_code` from the URL query string, validates the shape with a new Zod `userCodeSchema` (8 chars from the base32 RFC 4648 alphabet sans I, O, 0, 1), and renders the new `DeviceForm` component. Lives in the `(unprotected)/(auth)` sub-group alongside `login`, `signup`, `forgot-password`, `reset-password`, and `verify-email`, and inherits the centered `AuthContainer` layout from `(auth)/layout.tsx`.
  - New `DeviceForm` client component at `apps/app/components/auth/device-form.tsx`, re-exported from the auth barrel. Owns the four device-flow states (not signed in / claimed pending / approved / denied or expired) using `@tanstack/react-query` exclusively: `useQuery` for `authClient.device({ query: { user_code } })`, two `useMutation` for `authClient.device.approve(...)` and `authClient.device.deny(...)`. No raw `useState` or `useEffect` for the state machine.
  - `apps/app/lib/auth-client.ts` adds the `deviceAuthorizationClient()` Better Auth plugin so the four client methods (`authClient.device`, `device.approve`, `device.deny`, plus `device.code` and `device.token` for the CLI) are typed at the call site.
  - `apps/app/app/layout.tsx` mounts a new `QueryClientProvider` at the root, mounted _outside_ the theme and tooltip providers so every consumer is in scope.
  - `apps/app/proxy.ts` adds `/device` to `AUTH_PREFIXES` so a user already signed in is not bounced to `/login` when the CLI opens the browser to the verification URL.

  No user-visible behaviour change in normal operation. A user running `deesse auth login` on a fresh machine sees the verification page open in the browser, signs in (or is already signed in), sees an Approve / Deny panel, clicks Approve, the CLI picks up the session token on its next poll, and the user closes the tab. The page does not gate on `emailVerified` (per ADR-020); the existing email-verification gate that protects `/home` and `/settings` is unchanged.

### Patch Changes

- af040af: Implements ADR-021: first-class inter-app URLs in `@workspace/env`,
  removing the relative-path construction in three consumers.

  User-visible:

  - `https://deessejs.com/templates` and
    `https://deessejs.com/templates/[slug]` now render the populated
    catalog and the detail page respectively. Previously, the
    marketing site's oRPC client fetched `/api/v1/rpc/templates/list`
    relative to `deessejs.com`, which does not host the backend (the
    catch-all lives in `apps/app/app/api/[[...route]]/route.ts` on
    `app.deessejs.com`). The marketing site was showing the documented
    empty state and `/templates/[slug]` returned a Next.js 500.
  - `npx @deessejs/cli list` (and every other published CLI command)
    now resolves the API host to `https://app.deessejs.com` by
    default, instead of failing because it resolved the URL against
    the user's working directory.

  API surface:

  - `@workspace/env` gains four server fields (`WEB_URL`, `APP_URL`,
    `DOCS_URL`, `API_BASE_URL`) and four client fields
    (`NEXT_PUBLIC_WEB_URL`, `NEXT_PUBLIC_APP_URL`,
    `NEXT_PUBLIC_DOCS_URL`, `NEXT_PUBLIC_API_BASE_URL`). Defaults are
    localhost ports in dev and the canonical Vercel domains in
    production. A `.refine` rejects trailing slashes at parse time.
  - `apps/web/src/lib/orpc.ts` builds the oRPC URL via
    `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
  - `apps/app/proxy.ts` builds the auth probe URL via
    `new URL(path, serverEnv.API_BASE_URL)`.
  - `apps/cli/src/api/client.ts` and `apps/cli/src/version/check.ts`
    read `process.env.API_BASE_URL` directly (the published tarball
    cannot depend on the private `@workspace/env` package). Override
    via shell env (`API_BASE_URL=https://staging.example.com
deessejs list`).

  Tests:

  - New unit suite at `packages/env/tests/unit/schema.urls.test.ts`
    pins the URL contract (defaults parse, production URLs parse,
    trailing slashes rejected, non-URLs rejected).

  Vercel env (operational, no code change):

  - Production: `API_BASE_URL=https://app.deessejs.com` and the
    `NEXT_PUBLIC_API_BASE_URL` mirror must be set on `apps/web`'s
    Vercel project.
  - Production: `ALLOWED_ORIGINS` on `apps/app`'s Vercel project must
    include `https://deessejs.com` for the cross-origin
    no-credentials fetch from the marketing site (cf. ADR-021 §
    Cross-origin considerations).
  - Preview deployments: each Vercel preview defaults to
    `https://app.deessejs.com` (the schema default). A future ADR
    covers preview-vs-preview wiring.

- Updated dependencies [8bc8916]
- Updated dependencies [ac69a68]
- Updated dependencies [af040af]
- Updated dependencies [ba74f0c]
  - @workspace/auth@0.1.0
  - @workspace/env@0.0.1
  - @workspace/api@0.0.3
  - @workspace/ui@0.0.1

## 0.1.2

### Patch Changes

- @workspace/api@0.0.2
- @workspace/auth@0.0.2

## 0.1.1

### Patch Changes

- Updated dependencies [03712ca]
- Updated dependencies [28f8e6f]
  - @workspace/auth@0.0.1
  - @workspace/api@0.0.1
