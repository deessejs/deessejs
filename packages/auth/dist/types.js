/**
 * Branded types for session-related identifiers.
 *
 * Why: the Better Auth client returns sessions with two string fields —
 * `id` (the row id in the `session` table) and `token` (the cookie value
 * sent to the server). Both are `string` in TypeScript, so a function
 * `revokeSession({ token: ... })` will silently accept either at the type
 * level. The audit §3.4 found a real bug where `session.id` was passed
 * as `token`; the no-op revoke silently succeeded and the user's "lost
 * device" session stayed alive.
 *
 * Branding makes the two types non-interchangeable at compile time:
 * `revokeSession({ token: session.id })` is a TS error.
 *
 * Use the `as*` helpers only at trust boundaries (e.g. when mapping
 * `listSessions()` results to local UI state). Inside the UI, prefer to
 * pass branded values around as branded.
 */
/**
 * Trust-boundary casters. Use at the boundary where unbranded strings enter
 * our domain (API response, query param, env var). Do NOT use inside UI code
 * to silence the type checker.
 */
export const asSessionToken = (s) => s;
export const asSessionRowId = (s) => s;
export const asCurrentSessionToken = (s) => s;
