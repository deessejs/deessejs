"use client"

import { createAuthClient } from "better-auth/react"
import { clientEnv } from "@workspace/env/client"
import { API_AUTH_PATH } from "@workspace/api/base-path"

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
 */
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  basePath: API_AUTH_PATH,
})
