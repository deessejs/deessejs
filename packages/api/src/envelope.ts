import type { Context } from "hono"

/**
 * Stable JSON error envelope shared by every error path in the API.
 *
 * Wire format: `{ code, message, requestId }`. Adding a new top-level
 * field is a breaking change for clients (CLI, apps/web) — keep the
 * shape small and stable. Optional detail belongs in `details`.
 *
 * Why a single helper:
 *   - The `onError` global handler, the `notFound` handler, and the
 *     rate-limit 429 path all need the same shape. Without this, the
 *     shape drifts across paths and one consumer breaks while another
 *     keeps working.
 *   - `requestId` always falls back to "unknown" rather than crashing
 *     the error path — never let an "I'm trying to report an error"
 *     function throw a second error.
 */

export type ErrorBody = {
  code: string
  message: string
  requestId: string
}

const UNKNOWN_REQUEST_ID = "unknown"

/**
 * Read the requestId from the Hono context, falling back to "unknown".
 * Centralized so the fallback is consistent and impossible to forget.
 */
export const readRequestId = (c: Context): string =>
  c.get("requestId") ?? UNKNOWN_REQUEST_ID

/**
 * Build the canonical error envelope. Pass the status so callers can
 * forward it to `c.json(body, status)` without a second lookup.
 */
export const errorBody = (
  c: Context,
  code: string,
  message: string,
): ErrorBody => ({
  code,
  message,
  requestId: readRequestId(c),
})
