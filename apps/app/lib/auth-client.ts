"use client"

import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import {
  adminClient,
  deviceAuthorizationClient,
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
 * `deviceAuthorization` plugin. It exposes the four
 * methods the device page consumes: `authClient.device(...)`,
 * `authClient.device.approve(...)`, `authClient.device.deny(...)`,
 * plus `authClient.device.code(...)` and `authClient.device.token(...)`
 * for the CLI consumer.
 *
 * The `adminClient` plugin mirrors the server-side `admin` plugin
 * (RFC: "DeesseJS Administration Routes — V1"). V1 only consumes
 * the inferred `data.user.role` from `useSession()` to decide
 * whether to show the Administration nav link; the plugin's
 * full client surface (`authClient.admin.*`) is left untyped
 * from the call sites of V1 but is wired so future admin UI
 * (list/ban/impersonate) can call the native endpoints without
 * touching the client config again.
 *
 * The `baseURL` here uses `clientEnv.NEXT_PUBLIC_APP_URL`, the
 * build-time env var. On Vercel previews this resolves to the
 * production apex (`app.deessejs.com`); the fetch interceptor
 * installed via the side-effect import above rewrites the URL to
 * the page origin at request time. The same preview-rewriting
 * rationale is documented on `auth-base-url.ts`.
 *
 * The `as ReturnType<typeof createAuthClient<typeof authClientOptions>>`
 * cast on the export below is the matching fix for the TS2883
 * inference issue that surfaces on `createAuthClient({...})` with
 * multiple plugins — the same workaround applied in
 * `packages/auth/src/auth.ts`. The `satisfies BetterAuthClientOptions`
 * on the options object keeps the literal types narrow so the cast
 * narrows the public type to the configured client (and the
 * plugin-augmented `user.role` surface flows through).
 */
const authClientOptions = {
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  basePath: API_AUTH_PATH,
  plugins: [deviceAuthorizationClient(), adminClient()],
} satisfies BetterAuthClientOptions

export const authClient = createAuthClient(
  authClientOptions,
) as ReturnType<typeof createAuthClient<typeof authClientOptions>>
