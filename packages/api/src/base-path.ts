/**
 * Single source of truth for the API path.
 *
 * The Next.js catch-all at `apps/app/app/api/[[...route]]/route.ts` exposes
 * every route under `/api/*`. Hono is mounted with `basePath(API_BASE_PATH)`,
 * and the oRPC client targets `API_RPC_PATH` to reach the procedures endpoint.
 *
 * Renaming the API prefix means:
 *   1. Edit `API_BASE_PATH` below.
 *   2. Move the Next.js catch-all to match
 *      (e.g. `apps/app/app/v1/[[...route]]/route.ts` for prefix `/v1`).
 *   3. If you later introduce a `NEXT_PUBLIC_API_BASE_PATH` env override,
 *      read it here and have `API_BASE_PATH` default to it.
 *
 * Do NOT introduce a parallel "API path" hardcoded in any app or package —
 * always import from this module.
 *
 * Note: Hono routes are kept *relative* to `basePath`, so the Hono-side
 * patterns (`/health`, `/rpc/*`) are NOT exposed here — only the full
 * client-facing paths.
 */

export const API_BASE_PATH = "/api" as const

export const API_RPC_PATH = `${API_BASE_PATH}/rpc` as const
export const API_AUTH_PATH = `${API_BASE_PATH}/auth` as const
export const API_HEALTH_PATH = `${API_BASE_PATH}/health` as const
export const API_READY_PATH = `${API_BASE_PATH}/ready` as const