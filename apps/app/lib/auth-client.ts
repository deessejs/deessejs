"use client"

import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import {
  adminClient,
  deviceAuthorizationClient,
  organizationClient,
} from "better-auth/client/plugins"
import { API_AUTH_PATH } from "@workspace/api/base-path"
import { getAuthBaseUrl } from "./auth-base-url"

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
 * The `organizationClient` plugin mirrors the server-side
 * `organization` plugin. The first call site is the workspace
 * shell sidebar switcher; wiring the plugin here keeps the typed
 * `authClient.organization.*` surface coherent from the start.
 *
 * Resolve the origin at runtime in the browser so auth requests always
 * use the same deployment that served the page. The environment URL is
 * only a server-rendering fallback; it is not a browser API target.
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
  baseURL: getAuthBaseUrl(),
  basePath: API_AUTH_PATH,
  plugins: [
    deviceAuthorizationClient(),
    adminClient(),
    organizationClient(),
  ],
} satisfies BetterAuthClientOptions

export const authClient = createAuthClient(
  authClientOptions,
) as ReturnType<typeof createAuthClient<typeof authClientOptions>>
