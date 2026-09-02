"use client"

import { clientEnv } from "@workspace/env/client"

/**
 * Runtime resolution of the auth backend origin in the browser.
 *
 * ADR-028 Decision #4 — `withRelatedProject` reads
 * `VERCEL_RELATED_PROJECTS`, which Vercel injects only at runtime
 * on the server. The browser bundle never sees it, so we can't
 * use `withRelatedProject` from a Client Component. The simplest
 * rule that works for every deployment shape:
 *
 *   - If the page is served from a Vercel preview
 *     (`*.vercel.app` hostname), the auth backend lives on the
 *     SAME hostname (apps/app and its `/api/v1/auth/*` catch-all
 *     are deployed together per Vercel project). Use
 *     `window.location.origin` (self-fetch).
 *   - Otherwise (localhost dev, production apex), use
 *     `clientEnv.NEXT_PUBLIC_APP_URL` (the env var that the
 *     Vercel project `deessejs-app` configures per environment).
 *
 * This matches the pattern used by `apps/app/proxy.ts` for the
 * server-side self-fetch. Both layers resolve to the same origin
 * without env-var wiring per preview branch.
 */
export function getAuthBaseUrl(): string {
  if (typeof window !== "undefined") {
    const hostname = window.location.hostname
    if (hostname.endsWith(".vercel.app")) {
      return window.location.origin
    }
  }
  return clientEnv.NEXT_PUBLIC_APP_URL
}