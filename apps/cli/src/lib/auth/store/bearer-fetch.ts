import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../../../api/self-version.js"

import { resolveBaseURL } from "./better-auth-client.js"

/**
 * Minimal bearer-token fetch for the CLI.
 *
 * Used by auth status/logout and organization commands that call Better
 * Auth endpoints with the bearer token read from auth.json. The typed
 * Better Auth client handles the device flow; protected management calls
 * supply this CLI session token explicitly.
 *
 * The helper injects two headers:
 *   - User-Agent: DeesseJS CLI/<version> (the V1 label
 *     used by the /settings/sessions view of CLI sessions)
 *   - Authorization: Bearer <access_token> (caller-supplied)
 *
 * Path is appended to (baseURL + API_AUTH_PATH) so the
 * request is absolute. baseURL is resolved by the same
 * helper the typed client uses (`resolveBaseURL` from
 * better-auth-client.ts) so production and tests share
 * the same resolution. No hardcoded localhost default
 * here: end users who install the CLI do not control
 * their shell env, and pointing to localhost would be a
 * silent failure.
 */
function authUrl(path: string): string {
  const normalised = path.startsWith("/") ? path.slice(1) : path
  return `${resolveBaseURL()}${API_AUTH_PATH}/${normalised}`
}

export function bearerFetch(
  path: string,
  accessToken: string,
  init?: RequestInit
): Promise<Response> {
  const headers = new Headers(init?.headers)
  headers.set("user-agent", `DeesseJS CLI/${readPackageVersion()}`)
  headers.set("authorization", `Bearer ${accessToken}`)
  return fetch(authUrl(path), {
    ...init,
    headers,
  })
}
