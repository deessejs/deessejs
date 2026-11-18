import { createWebClient, type WebClient } from "@workspace/api/client/web"

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
export type ORPCBrowserClient = WebClient

export const orpcBrowser: ORPCBrowserClient = createWebClient()
