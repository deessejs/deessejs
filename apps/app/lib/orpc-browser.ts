import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

/**
 * The oRPC client for the browser.
 *
 * The server client forwards the session cookie from the request
 * headers, which is why it reads `next/headers` and why it is a
 * server module. The browser needs none of that: it is on the same
 * origin as the API, and it sends the session cookie on its own.
 *
 * The router is imported as a type, so the API's server-only graph
 * stays out of the browser bundle, exactly as in the server client.
 */
const link = new RPCLink({
  // The link builds the request with `new URL(baseUrl)`, which needs
  // an absolute URL. The page's origin is the right one on every
  // deployment, a preview included, and it is read when the request
  // is made: a client component's module is also evaluated on the
  // server, where `window` does not exist.
  url: () => new URL(API_RPC_PATH, window.location.origin).toString(),
})

export type ORPCBrowserClient = RouterClient<typeof appRouter>

export const orpcBrowser: ORPCBrowserClient = createORPCClient(link)
