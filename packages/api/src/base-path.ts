/**
 * Single source of truth for the API path.
 *
 * The Next.js catch-all at `apps/app/app/api/[[...route]]/route.ts` exposes
 * every route under the active base path. Hono is mounted with
 * `basePath(API_BASE_PATH)`, and the oRPC client targets `API_RPC_PATH` to
 * reach the procedures endpoint.
 *
 * Versioning strategy (locked in docs/engineering/plans/robust-shared-backend.md):
 *   - Each contract version lives under `packages/contracts/src/vN/`.
 *   - The HTTP URL prefix mirrors that: `API_BASE_PATH_V1 = "/api/v1"`.
 *   - `API_BASE_PATH` aliases the *active* version. When a V2 is introduced,
 *     define `API_BASE_PATH_V2`, point `API_BASE_PATH` at it, and keep V1
 *     served as a deprecated alias for installed CLI V1.x clients.
 *
 * Renaming the API prefix means:
 *   1. Edit `API_BASE_PATH_V*` below.
 *   2. Move (or alias) the Next.js catch-all to match.
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

export const API_BASE_PATH_V1 = "/api/v1" as const

/** Active version. Alias of the latest released base path. */
export const API_BASE_PATH = API_BASE_PATH_V1

export const API_RPC_PATH = `${API_BASE_PATH}/rpc` as const
export const API_AUTH_PATH = `${API_BASE_PATH}/auth` as const
export const API_HEALTH_PATH = `${API_BASE_PATH}/health` as const
export const API_READY_PATH = `${API_BASE_PATH}/ready` as const
export const API_TEMPLATES_PATH = `${API_BASE_PATH}/templates` as const