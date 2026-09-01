"use client"

import { createAuthClient } from "better-auth/react"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import { apiBaseUrl } from "./preview-urls"

/**
 * Better Auth client for the marketing site (ADR-023).
 *
 * `baseURL` is the auth backend origin (`app.deessejs.com` in prod,
 * `localhost:3001` in dev). It MUST NOT be `NEXT_PUBLIC_WEB_URL`
 * (the marketing origin) because the `/api/v1/auth/*` handler is
 * mounted only on `apps/app`'s catch-all at
 * `apps/app/app/api/[[...route]]/route.ts`. apps/web has no
 * `src/app/api/` directory. This mirrors the precedent at
 * `apps/web/src/lib/orpc.ts:119`, which composes the oRPC URL
 * from `API_RPC_PATH` + `clientEnv.NEXT_PUBLIC_API_BASE_URL`.
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
 * `packages/auth/src/auth.ts`) is enabled via the
 * `PARENT_DOMAIN` env var. Once set in production, the session
 * cookie is shared between `deessejs.com` and `app.deessejs.com`,
 * so `authClient.useSession()` returns the live session from
 * the marketing origin.
 *
 * The SERVER-side auth handler at `packages/auth/src/auth.ts`
 * resolves its `baseURL` per request from `x-forwarded-host` /
 * `host` via the dynamic `{ allowedHosts }` form (see
 * `docs/guides/better-auth/pitfalls.md` §5). The CLIENT-side
 * `baseURL` here is build-time-inlined from
 * `clientEnv.NEXT_PUBLIC_API_BASE_URL` and is intentionally
 * static — browsers call the same origin they loaded from.
 */
export const authClient = createAuthClient({
  baseURL: apiBaseUrl,
  basePath: API_AUTH_PATH,
})
