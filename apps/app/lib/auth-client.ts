"use client"

import { createAuthClient } from "better-auth/react"
import {
	deviceAuthorizationClient,
	organizationClient,
} from "better-auth/client/plugins"
import { clientEnv } from "@workspace/env/client"
import { API_AUTH_PATH } from "@workspace/api/base-path"

// Side-effect import: installs a `window.fetch` interceptor that
// rewrites `/api/v1/auth/*` requests to the page's origin on
// Vercel previews. See `./fetch-auth-interceptor.ts` for the
// rationale — `baseURL` here is build-time inlined and would
// otherwise point at production on every preview.
import "./fetch-auth-interceptor"

/**
 * Better Auth is mounted on Hono at `${API_BASE_PATH}/auth/*` (see
 * `packages/api/src/index.ts` and `packages/api/src/constants/base-path.ts`).
 * Without `basePath`, the client hits `${baseURL}/api/auth/*`, which
 * returns 404 and silently aborts the signup / signin flow.
 * `API_AUTH_PATH` is the single source of truth — the Hono server
 * reads from the same constant, so the client cannot drift.
 *
 * The subpath `@workspace/api/base-path` is imported (not the main
 * barrel) because it pulls only the path constants. Importing from
 * `@workspace/api` would also drag `@workspace/auth` →
 * `@workspace/database` → `postgres` into the client bundle, which
 * Turbopack cannot satisfy (node builtins `net`/`tls`/`perf_hooks`).
 *
 * The `deviceAuthorizationClient` plugin mirrors the server-side
 * `deviceAuthorization` plugin (ADR-020). It exposes the four
 * methods the device page consumes: `authClient.device(...)`,
 * `authClient.device.approve(...)`, `authClient.device.deny(...)`,
 * plus `authClient.device.code(...)` and `authClient.device.token(...)`
 * for the CLI consumer.
 *
 * The `baseURL` here uses `clientEnv.NEXT_PUBLIC_APP_URL`, the
 * build-time env var. On Vercel previews this resolves to the
 * production apex (`app.deessejs.com`); the fetch interceptor
 * installed via the side-effect import above rewrites the URL to
 * the page origin at request time. See ADR-029 Decision #4 for the
 * full rationale.
 */
// The inferred return type of `createAuthClient` references
// `AuthQueryAtom` from `better-auth/client/query.mjs`, which TS
// cannot name in this module's emitted declaration
// ("The inferred type of 'authClient' cannot be named without a
// reference to 'AuthQueryAtom'…"). This is a known better-auth
// portability issue with the `organizationClient` plugin's deep
// generic. The runtime value is unaffected.
//
// The fix is to capture the result in a `const` whose type we
// then extract via `typeof`, and re-export through a
// `ReturnType`-flavored alias. The deep type stays in the
// declaration's `typeof` reference, but TS resolves it through
// the union intersection at the property access boundary, so
// the portability error is silenced while `organization`,
// `listSessions`, `listAccounts`, `revokeSession`,
// `revokeOtherSessions`, `unlinkAccount`, `linkSocial`, and
// `getSession` remain accessible at full inference at call
// sites.
const _authClient = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  basePath: API_AUTH_PATH,
  // `organizationClient()` mirrors the server-side `organization()` plugin
  // added in `packages/auth/src/auth.ts` (RFC-001). It exposes the
  // `authClient.organization.create`, `setActive`, `inviteMember`,
  // `acceptInvitation`, `list`, `update`, `delete` and member-management
  // methods the onboarding wizard and the sidebar switcher consume.
  // If the Admin RFC has already added `adminClient()` on this branch,
  // preserve it here.
  plugins: [deviceAuthorizationClient(), organizationClient()],
})

// `typeof _authClient` re-references the same deep inferred
// type, but at this point the declaration's
// `authClient: typeof _authClient` doesn't trigger the
// portability error because the deep reference is
// recoverable from a local binding. (The error fires on
// implicit exports of the `createAuthClient` call's
// inferred return, not on `typeof` re-references.)
export const authClient: typeof _authClient = _authClient
