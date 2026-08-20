import { createAuthClient } from "better-auth/client"
import { deviceAuthorizationClient } from "better-auth/client/plugins"
import { API_AUTH_PATH } from "@workspace/api/base-path"

import { readPackageVersion } from "../api/self-version.js"

/**
 * Better Auth client for the CLI (ADR-020).
 *
 * Mirrors the server-side `deviceAuthorization` plugin. The
 * client side of the device flow runs in Node, not in a
 * browser, so we import the framework-agnostic client
 * (`better-auth/client`, NOT `better-auth/react`). The
 * `react` subpath only adds hooks like `useSession` that
 * the CLI does not consume.
 *
 * `disableDefaultFetchPlugins: true` is set explicitly. The
 * default plugins include a redirect handler that intercepts
 * `window.location`-style redirects, which is meaningless
 * in Node. The official Better Auth docs recommend this for
 * any non-browser environment (React Native, Expo, Node).
 *
 * `fetchOptions.headers` injects the CLI User-Agent on every
 * request. The static form is sufficient here: the version
 * does not change between two requests in the same process,
 * so there is no need for the dynamic form. Better-fetch
 * merges the headers into every outgoing request alongside
 * the per-plugin headers (Authorization, Content-Type).
 *
 * `baseURL` comes from the `DEESSEJS_API_URL` env var.
 * The CLI does not introduce a `--api-url` flag (ADR-010 §6
 * says per-command URL overrides are not public in V1). An
 * env var keeps the public surface unchanged while making
 * the auth flow possible. Default to localhost in dev so the
 * commands do not crash without explicit configuration.
 *
 * Note: importing from `better-auth/client` directly would
 * be tempting but resolves to the framework-agnostic core
 * (vanilla). `better-auth/client/plugins` is the sibling
 * that re-exports the framework-agnostic plugin client
 * (`deviceAuthorizationClient`).
 */
export const authClient = createAuthClient({
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
