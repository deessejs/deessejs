import { createAuthClient } from "better-auth/client"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../../../api/self-version.js"

/**
 * Better Auth client factory for the CLI (ADR-020).
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
 * request (ADR-020 limitation 1 mitigation).
 *
 * `baseURL` comes from the `DEESSEJS_API_URL` env var. The
 * CLI does not introduce a `--api-url` flag (ADR-010 §6).
 * Default to localhost in dev so the commands do not crash
 * without explicit configuration.
 */
export function createCliAuthClient() {
	return createAuthClient({
		baseURL: process.env.DEESSEJS_API_URL ?? "http://localhost:3000",
		basePath: API_AUTH_PATH,
		plugins: [deviceAuthorizationClient()],
		disableDefaultFetchPlugins: true,
		fetchOptions: {
			headers: {
				"user-agent": `DeesseJS CLI/${readPackageVersion()}`,
			},
		},
	})
}
