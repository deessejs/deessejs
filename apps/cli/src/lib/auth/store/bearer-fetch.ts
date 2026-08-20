import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../../../api/self-version.js"

/**
 * Minimal bearer-token fetch for the CLI (ADR-020).
 *
 * Used only by auth status and auth logout, both of which
 * need to call Better Auth endpoints with a bearer token
 * read from ~/.deessejs/auth.json. The typed client
 * (apps/cli/src/lib/auth/store/better-auth-client.ts) does
 * not support this case: it sends the bearer via its
 * cookie-based session, not a caller-supplied token.
 *
 * The helper injects two headers:
 *   - User-Agent: DeesseJS CLI/<version> (per ADR-020
 *     limitation 1 mitigation, the V1 label for the
 *     /settings/sessions view of CLI sessions)
 *   - Authorization: Bearer <access_token> (caller-supplied)
 *
 * Path is appended to (baseURL + API_AUTH_PATH) so the
 * request is absolute. baseURL comes from DEESSEJS_API_URL
 * (same source the typed client reads) so production and
 * tests share the same resolution. The default to
 * http://localhost:3000 mirrors better-auth-client.ts.
 */
function authUrl(path: string): string {
	const normalised = path.startsWith("/") ? path.slice(1) : path
	const baseURL = process.env.DEESSEJS_API_URL ?? "http://localhost:3000"
	return `${baseURL}${API_AUTH_PATH}/${normalised}`
}

export function bearerFetch(
	path: string,
	accessToken: string,
	init?: RequestInit,
): Promise<Response> {
	const headers = new Headers(init?.headers)
	headers.set("user-agent", `DeesseJS CLI/${readPackageVersion()}`)
	headers.set("authorization", `Bearer ${accessToken}`)
	return fetch(authUrl(path), {
		...init,
		headers,
	})
}
