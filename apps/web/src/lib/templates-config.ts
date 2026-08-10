/**
 * Server-side config for the templates fetch.
 *
 * `TEMPLATES_URL` is read at module-load time on the server. The fallback
 * is the production endpoint. Vercel previews can override via the
 * project's environment settings.
 *
 * This module must never be imported by a client component: the value
 * is server-only and bundling it would expose nothing (no secret), but
 * the intent is clear from the file location.
 */

/**
 * oRPC endpoint base URL. The client appends procedure paths
 * automatically. Same value as `API_RPC_PATH` in
 * `@workspace/api/base-path` (kept as a string here so the marketing
 * app does not depend on the API package's runtime exports).
 */
const FALLBACK_TEMPLATES_URL = "https://app.deessejs.com/api/v1/rpc"

/**
 * Convenience export for the oRPC client. Same string as
 * `FALLBACK_TEMPLATES_URL` (or the env override), surfaced under a
 * name that signals "this is the oRPC endpoint, not the legacy REST
 * route that used to live at /api/v1/templates".
 */
export const TEMPLATES_RPC_URL: string =
  process.env.TEMPLATES_RPC_URL ?? FALLBACK_TEMPLATES_URL

export const TEMPLATES_URL: string =
  process.env.TEMPLATES_URL ?? FALLBACK_TEMPLATES_URL

/** Cache TTL for the templates fetch, in seconds. */
export const TEMPLATES_REVALIDATE_SECONDS = 600
