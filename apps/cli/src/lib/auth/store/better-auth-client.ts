import { createAuthClient } from "better-auth/client"
import type { BetterAuthClientOptions } from "better-auth/client"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../../../api/self-version.js"

/**
 * Production default for the CLI's `baseURL`.
 *
 * The CLI ships to npm as `@deessejs/cli`. When an end user
 * runs `npx @deessejs/cli@latest <cmd>` they have no
 * control over `process.env.DEESSEJS_API_URL` (it is the
 * shell environment of the user's machine, not the CLI's).
 * Baked-in defaults are the only mechanism that works
 * out of the box.
 *
 * The host `app.deessejs.com` is the production API host
 * (both the Hono↔Better-Auth basePath fix and the API CI
 * suite exercise `app.deessejs.com/api/v1/...`). The
 * `basePath` of `/api/v1/auth` is appended by the Better Auth
 * client, so the device-flow endpoints live at
 * `${baseURL}${API_AUTH_PATH}/device/*` =
 * `https://app.deessejs.com/api/v1/auth/device/*`.
 *
 * (Note: an earlier draft of this comment cited
 * `deessejs.com`, which is the marketing apex. That host
 * does not serve the API. The canonical prod API host is
 * `app.deessejs.com`, confirmed by the basePath regression
 * analysis and the API CI integration tests.)
 *
 * Three sources, in priority order:
 *   1. `DEESSEJS_API_URL` env var (CI / dev override;
 *      never set by end users in practice).
 *   2. The baked-in default below (production).
 *   3. A thrown validation error when source 1 is set but
 *      malformed (malformed values fail loudly).
 */
export const DEFAULT_API_URL = "https://app.deessejs.com"

export function resolveBaseURL(): string {
	const raw = process.env.DEESSEJS_API_URL ?? DEFAULT_API_URL
	try {
		const parsed = new URL(raw)
		if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
			throw new Error(
				`DEESSEJS_API_URL must use http or https (got ${parsed.protocol ?? "no protocol"})`,
			)
		}
		return parsed.toString().replace(/\/$/, "")
	} catch (e) {
		const detail = e instanceof Error ? e.message : String(e)
		throw new Error(
			`DEESSEJS_API_URL is malformed: ${detail}. ` +
				`Expected a full URL like https://api.example.com.`,
		)
	}
}

/**
 * Better Auth client factory for the CLI.
 *
 * The factory is the public surface (not a singleton).
 * Two reasons:
 *   1. Tests need to override `DEESSEJS_API_URL` before the
 *      client is built; a module-level singleton would
 *      capture the env var at import time and freeze it.
 *   2. Each command that touches the server runs at a
 *      different point in the process lifetime; a fresh
 *      client per call is fine because createAuthClient is
 *      cheap (a Proxy + a few plugins).
 *
 * The framework-agnostic core (`better-auth/client`) is used
 * rather than `better-auth/react`. The react subpath only
 * adds hooks like `useSession` that the CLI does not consume.
 *
 * `disableDefaultFetchPlugins: true` is set for Node: the
 * default plugins include a redirect handler that intercepts
 * `window.location`-style redirects, which is meaningless in
 * Node.
 *
 * `fetchOptions.headers` injects the CLI User-Agent on every
 * request so the `/settings/sessions` view can label CLI
 * sessions correctly.
 */
const cliAuthClientOptions = {
	// baseURL is read **inside** `createCliAuthClient`, not
	// here, so tests can override `DEESSEJS_API_URL` in
	// `beforeEach` and have the new value picked up. Reading
	// it at module-load time freezes the value at import and
	// tests (and any other runtime that mutates the env
	// between import and call) silently hit the production
	// API. See test/integration/auth/login.test.ts.
	basePath: API_AUTH_PATH,
	plugins: [deviceAuthorizationClient()],
	disableDefaultFetchPlugins: true,
	fetchOptions: {
		headers: {
			"user-agent": `DeesseJS CLI/${readPackageVersion()}`,
		},
	},
} satisfies BetterAuthClientOptions

export function createCliAuthClient() {
	return createAuthClient({
		...cliAuthClientOptions,
		baseURL: resolveBaseURL(),
	})
}
