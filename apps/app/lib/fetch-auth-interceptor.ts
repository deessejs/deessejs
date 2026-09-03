"use client"

import { API_AUTH_PATH } from "@workspace/api/base-path"
import { getAuthBaseUrl } from "./auth-base-url"

/**
 * Install a `window.fetch` interceptor that rewrites the origin of
 * better-auth requests to match the current page origin on Vercel
 * previews.
 *
 * Why this exists: `apps/app/lib/auth-client.ts` is a top-level
 * module with `baseURL: clientEnv.NEXT_PUBLIC_APP_URL` inlined at
 * build time. On a Vercel preview deploy, that env var points at
 * the production apex (`app.deessejs.com`), so every auth request
 * from a preview hits prod and the CORS preflight fails.
 *
 * The interceptor catches every fetch to `/api/v1/auth/*` and
 * rewrites its origin to `getAuthBaseUrl()` (self-origin on
 * previews, configured env var elsewhere). One install, 16 call
 * sites untouched.
 *
 * The install is idempotent: a flag on `globalThis` prevents
 * double-registration under Fast Refresh or HMR.
 */

const AUTH_PATH_PREFIX = `${API_AUTH_PATH}/`

declare global {
  var __deessejsAuthFetchInstalled: boolean | undefined
}

export function installAuthFetchInterceptor(): void {
  if (typeof window === "undefined") return
  if (globalThis.__deessejsAuthFetchInstalled) return
  globalThis.__deessejsAuthFetchInstalled = true

  const originalFetch = window.fetch.bind(window)

  window.fetch = function patchedFetch(
    input: RequestInfo | URL,
    init?: RequestInit,
  ): Promise<Response> {
    const url = resolveUrl(input)
    if (url && url.pathname.startsWith(AUTH_PATH_PREFIX)) {
      const target = getAuthBaseUrl()
      const rewritten = new URL(url.pathname + url.search + url.hash, target)
      return originalFetch(rewritten, init)
    }
    return originalFetch(input, init)
  }
}

function resolveUrl(input: RequestInfo | URL): URL | null {
  if (typeof input === "string") {
    try {
      return new URL(input, window.location.origin)
    } catch {
      return null
    }
  }
  if (input instanceof URL) return input
  if (typeof Request !== "undefined" && input instanceof Request) {
    try {
      return new URL(input.url)
    } catch {
      return null
    }
  }
  return null
}

// Install on module load. The Client Component that imports this
// module triggers the install as a side-effect of evaluation.
// Guarded by `__deessejsAuthFetchInstalled` so multiple importers
// don't double-patch.
installAuthFetchInterceptor()