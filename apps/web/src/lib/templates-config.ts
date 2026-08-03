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

const FALLBACK_TEMPLATES_URL = "https://app.deessejs.com/api/v1/templates"

export const TEMPLATES_URL: string =
  process.env.TEMPLATES_URL ?? FALLBACK_TEMPLATES_URL

/** Cache TTL for the templates fetch, in seconds. */
export const TEMPLATES_REVALIDATE_SECONDS = 600
