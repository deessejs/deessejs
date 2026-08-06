"use client"

import { createAuthClient } from "better-auth/react"
import { API_AUTH_PATH } from "@workspace/api/base-path"

/**
 * Better Auth is mounted on Hono at `${API_BASE_PATH}/auth/*` (see
 * `packages/api/src/index.ts` and `packages/api/src/base-path.ts`).
 * `basePath` keeps the client on the versioned endpoint regardless of
 * which host the app is served from.
 *
 * `baseURL` is set to `window.location.origin` so the client posts to
 * the same origin it was loaded from. This removes a class of bugs
 * where `NEXT_PUBLIC_APP_URL` was unset, mismatched, or pointing at
 * a different origin (the previous client fell back to
 * `http://localhost:3000` on Vercel when the env var was missing,
 * which produced CORS errors in the browser).
 */
export const authClient: ReturnType<typeof createAuthClient> = createAuthClient({
  baseURL:
    typeof window !== "undefined" ? window.location.origin : undefined,
  basePath: API_AUTH_PATH,
})
