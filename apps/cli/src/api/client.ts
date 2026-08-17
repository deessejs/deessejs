import {
  ClientRetryPlugin,
  RetryAfterPlugin,
} from "@orpc/client/plugins"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCClient } from "@orpc/client"
import type { RouterClient } from "@orpc/server"

import { appRouter } from "@workspace/api/router"
import { getApiRpcUrl } from "./runtime.js"

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
 * Whether an error thrown from the wire layer is a transient network
 * error (DNS failure, TCP reset, timeout). These are worth retrying;
 * typed ORPCError and other application errors are not.
 */
const isTransientNetworkError = (e: unknown): boolean =>
  e instanceof TypeError

const link = new RPCLink({
  url: getApiRpcUrl(),
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
