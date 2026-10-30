"use client"

import { clientEnv } from "@workspace/env/client"

/**
 * Resolve the auth endpoint to the origin serving this app. The app's
 * Next.js catch-all exposes the API on every deployment host, including
 * custom domains and Vercel custom environments.
 *
 * During server rendering there is no browser origin, so use the
 * configured URL as a fallback. The client bundle evaluates this helper
 * in the browser and therefore uses the active deployment origin.
 */
export function getAuthBaseUrl(): string {
  if (typeof window !== "undefined") return window.location.origin
  return clientEnv.NEXT_PUBLIC_APP_URL
}
