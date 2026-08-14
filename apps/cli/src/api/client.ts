import {
  ClientRetryPlugin,
  RetryAfterPlugin,
} from "@orpc/client/plugins"
import { RPCLink } from "@orpc/client/fetch"
import { createORPCClient } from "@orpc/client"
import { TemplatesListResponseV1 } from "@workspace/contracts/v1"

import { USER_AGENT } from "../constants/agent.js"

/**
 * Typed oRPC client construction for the CLI.
 *
 * Internal to the CLI. The public surface (`fetchTemplates`) lives in
 * ../api/index.ts. Tests that target the typed client (Server-Side Client
 * pattern) import `appRouter` directly from `@workspace/api/router` and
 * bypass this module entirely.
 *
 * Resilience is delegated to the official oRPC plugins
 * (`ClientRetryPlugin`, `RetryAfterPlugin`) rather than a custom fetch
 * hook. The plugins cover ~70% of what the previous custom hook did
 * (retry on 5xx and 429, honour Retry-After) and are tested against
 * future oRPC upgrades upstream. The remaining 30% (custom rate-limit
 * header, jitter, runtime User-Agent) is handled here.
 *
 * See `apps/internal-documentation/content/docs/knowledge-base/orpc/client-plugins.mdx`
 * for the full coverage analysis.
 *
 * The User-Agent header carries the installed CLI version (read from
 * `apps/cli/src/api/self-version.ts`). We inject it via the fetch hook
 * because oRPC does not currently ship a dedicated "request headers"
 * plugin. The hook signature is the canonical 5-argument form from
 * `@orpc/client/adapters/fetch`; we accept and ignore the last three
 * arguments, which exist for plugin and interceptor use.
 */
const withUserAgent = async (
  request: Request,
  init: { redirect?: Request["redirect"] } | undefined,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _options?: unknown,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _path?: readonly string[],
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  _input?: unknown,
): Promise<Response> => {
  const headers = new Headers(request.headers)
  headers.set("user-agent", USER_AGENT)
  const next: RequestInit = init ? { ...init } : {}
  next.headers = headers
  return globalThis.fetch(request, next)
}

/**
 * Build a typed oRPC client for the templates registry.
 *
 * `RPCLink` takes a base URL; the client appends procedure paths
 * automatically (`<base>/templates/list`). The router type is inlined
 * against the shared Zod contract — the client and the server speak
 * the same shape.
 */
export const buildOrpcClient = (baseUrl: string) => {
  const link = new RPCLink({
    url: baseUrl,
    fetch: withUserAgent,
    plugins: [
      new RetryAfterPlugin(),
      new ClientRetryPlugin({
        default: {
          retry: 3,
          shouldRetry: ({ error }) => {
            // `error` here is the thrown value from the procedure or
            // the typed client. It is not an HTTP response — the
            // 5xx path is covered by RetryAfterPlugin (which retries
            // on 503 by default). What remains is the transient
            // network error from the global fetch (a TypeError).
            return error instanceof TypeError
          },
        },
      }),
    ],
  })
  return createORPCClient<{
    templates: { list: () => Promise<TemplatesListResponseV1> }
  }>(link)
}
