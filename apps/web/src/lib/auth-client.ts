"use client"

import { createAuthClient } from "better-auth/react"
import { API_AUTH_PATH } from "@workspace/api/base-path"

/**
 * Better Auth client factory for the marketing site (ADR-023).
 *
 * Returns a fresh `authClient` instance with a runtime-resolved
 * `baseURL`. The previous shape was a top-level
 * `export const authClient = createAuthClient(...)` — that worked
 * in dev but silently froze `baseURL` to the URL resolved at
 * module load. The browser bundle never sees
 * `VERCEL_RELATED_PROJECTS`, so `withRelatedProject` always fell
 * back to `defaultHost` (= the prod URL) on Vercel previews. The
 * Server Component wrapper at `user-menu-server.tsx` resolves the
 * URL server-side and calls this factory at component-mount time
 * with the resolved value.
 *
 * `basePath` is imported from `@workspace/api/base-path` (the
 * subpath) rather than from `@workspace/api` (the barrel).
 * Importing the barrel would drag `@workspace/auth` →
 * `@workspace/database` → `postgres` (node builtins `net`,
 * `tls`, `perf_hooks`) into the client bundle, which Turbopack
 * cannot satisfy. The subpath exposes only the path constants.
 *
 * The `deviceAuthorizationClient()` plugin (added in
 * `apps/app/lib/auth-client.ts`) is intentionally OMITTED here.
 * The device-flow surface lives on apps/app (`/device` page,
 * `useDeviceClaim` hook); apps/web does not host it.
 *
 * Cross-subdomain cookie sharing (`crossSubDomainCookies` in
 * `packages/auth/src/auth.ts`) is enabled via the `PARENT_DOMAIN`
 * env var. Once set in production, the session cookie is shared
 * between `deessejs.com` and `app.deessejs.com`, so the session
 * is visible from the marketing origin.
 *
 * The SERVER-side auth handler at `packages/auth/src/auth.ts`
 * resolves its `baseURL` per request from `x-forwarded-host` /
 * `host` via the dynamic `{ allowedHosts }` form (see
 * `docs/guides/better-auth/pitfalls.md` §5).
 */
export function createAuthClientFor(apiBaseUrl: string) {
  return createAuthClient({
    baseURL: apiBaseUrl,
    basePath: API_AUTH_PATH,
  })
}
