import {
  ClientRetryPlugin,
  RetryAfterPlugin,
} from "@orpc/client/plugins"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCClient } from "@orpc/client"
import type { RouterClient } from "@orpc/server"

import { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

/**
 * Typed oRPC link for the CLI.
 *
 * Internal to the CLI. The public surface (`fetchTemplates`) lives in
 * ../api/index.ts. Tests that target the typed client (Server-Side Client
 * pattern) import `appRouter` directly from `@workspace/api/router` and
 * bypass this module entirely.
 *
 * Resilience is delegated to the official oRPC plugins
 * (`ClientRetryPlugin`, `RetryAfterPlugin`); the HTTP fetch itself is
 * `globalThis.fetch` (the oRPC default). The plugins cover retry on
 * transient network errors and on 429 / 503 honouring `Retry-After`.
 *
 * See `apps/internal-documentation/content/docs/knowledge-base/orpc/client-plugins.mdx`
 * for the full coverage analysis.
 *
 * The previous custom `orpcFetch` hook (which injected the User-Agent
 * header and did bespoke retries) was removed in favour of the plugins.
 * The User-Agent header is no longer sent from the typed client. The
 * system-level version probe (`apps/cli/src/version/check.ts`) still
 * sends a User-Agent because it hits a Hono-direct endpoint, not an
 * oRPC procedure.
 */
/**
 * Production default for the CLI's `baseURL`. Mirrors
 * `apps/cli/src/lib/auth/store/better-auth-client.ts` so production
 * and tests share the same resolution (per ADR-015/016: canonical
 * prod API host is `app.deessejs.com`, NOT `deessejs.com` which is
 * the marketing apex).
 */
export const DEFAULT_API_URL = "https://app.deessejs.com"

/**
 * Resolve the API base URL.
 *
 * Three sources, in priority order:
 *   1. `DEESSEJS_API_URL` env var (CI / dev override; never set by
 *      end users in practice).
 *   2. The baked-in default above (production).
 *   3. A thrown validation error when source 1 is set but malformed.
 */
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
 * Whether an error thrown from the wire layer is a transient network
 * error (DNS failure, TCP reset, timeout). These are worth retrying;
 * typed ORPCError and other application errors are not.
 */
const isTransientNetworkError = (e: unknown): boolean =>
  e instanceof TypeError

/**
 * RPCLink URL must be absolute in a Node CLI context.
 *
 * The oRPC `RPCLink` resolves a relative `url` against the host page's
 * origin via `new URL(...)`, which is meaningless in a Node binary (no
 * `window.location`). Passing `API_RPC_PATH` (= `"/api/v1/rpc"`) as-is
 * raised `TypeError: Invalid URL` on every command, surfaced to users
 * as `network_error` with hint `Invalid URL` despite the network being
 * fine.
 *
 * Fix: join `resolveBaseURL()` and `API_RPC_PATH` to an absolute URL.
 * `resolveBaseURL()` strips a trailing slash; `API_RPC_PATH` starts
 * with `/`, so the concatenation is unambiguous.
 */
const link = new RPCLink({
  url: `${resolveBaseURL()}${API_RPC_PATH}`,
  plugins: [
    new RetryAfterPlugin(),
    new ClientRetryPlugin({
      default: {
        retry: 3,
        shouldRetry: ({ error }) => isTransientNetworkError(error),
      },
    }),
  ],
})

export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)
