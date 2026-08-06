"use client"

import { createAuthClient } from "better-auth/react"
import { clientEnv } from "@workspace/env/client"
import { API_AUTH_PATH } from "@workspace/api/base-path"

/**
 * Better Auth is mounted on Hono at `${API_BASE_PATH}/auth/*` (see
 * `packages/api/src/index.ts` and `packages/api/src/base-path.ts`).
 * Without `basePath`, the client hits `${baseURL}/api/auth/*`, which
 * returns 404 and silently aborts the signup / signin flow.
 * `API_AUTH_PATH` is the single source of truth — the Hono server
 * reads from the same constant, so the client cannot drift.
 */
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL: clientEnv.NEXT_PUBLIC_APP_URL,
  basePath: API_AUTH_PATH,
})
