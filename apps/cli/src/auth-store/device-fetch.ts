import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../api/self-version.js"

/**
 * Device-flow HTTP wrapper (ADR-020).
 *
 * The CLI's device-flow HTTP calls do NOT go through the typed
 * oRPC client (the device-flow is a Better Auth /system route,
 * per ADR-011, not a business procedure). This wrapper centralises
 * the HTTP fetch with two responsibilities:
 *
 *   1. Inject the CLI's `User-Agent` header on every request.
 *      The header value is the single string
 *        `DeesseJS CLI/<version>`
 *      where `<version>` is read from the build-time-injected
 *      `process.env.CLI_PACKAGE_VERSION` (see apps/cli/tsup.config.ts).
 *      The server stores this on `session.userAgent`, which means
 *      the CLI session is identifiable in /settings/sessions
 *      without any schema change.
 *
 *      ADR-020 "Known limitations in this version", limitation 1.
 *      This is the V1 mitigation: no per-user toggle, no opt-out,
 *      purely informational.
 *
 *   2. Resolve request paths against `API_AUTH_PATH` so the
 *      mount and base-path stay the single source of truth
 *      (`@workspace/api/base-path`). A future change to the
 *      auth mount base path propagates here automatically.
 *
 * Per ADR-001, the wire format is whatever Better Auth publishes;
 * the wrapper does not transform the body. It returns the raw
 * `Response`; callers inspect `status` and parse the JSON body
 * with their own expectations.
 *
 * The path argument is appended to `${API_AUTH_PATH}/`. Callers
 * pass `"device/code"`, `"device/token"`, `"device"`,
 * `"device/approve"`, `"device/deny"` — the same five endpoints
 * the Better Auth plugin exposes.
 */
function authUrl(path: string): string {
	const normalised = path.startsWith("/") ? path.slice(1) : path
	return `${API_AUTH_PATH}/${normalised}`
}

function buildHeaders(init?: RequestInit): Headers {
	const headers = new Headers(init?.headers)
	headers.set("User-Agent", `DeesseJS CLI/${readPackageVersion()}`)
	if (!headers.has("content-type") && init?.body) {
		headers.set("content-type", "application/json")
	}
	return headers
}

export function deviceFetch(
	path: string,
	init?: RequestInit,
): Promise<Response> {
	return fetch(authUrl(path), {
		...init,
		headers: buildHeaders(init),
	})
}
