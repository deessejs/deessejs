import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "../orpc/index.js"
import { API_RPC_PATH } from "../constants/base-path.js"

/** Browser-only transport options. Apps may supply host and fetch behavior. */
export type WebClientOptions<TContext extends Record<string, unknown> = Record<string, never>> = {
  url?: string | (() => string)
  fetch?: (request: Request, init: RequestInit, options: { context?: TContext }) => Promise<Response>
}

export type WebClient<TContext extends Record<string, unknown> = Record<string, never>> =
  RouterClient<typeof appRouter, TContext>

function getPageOrigin(): string {
  const pageLocation = Reflect.get(globalThis, "location")
  if (
    typeof pageLocation !== "object" ||
    pageLocation === null ||
    !("origin" in pageLocation) ||
    typeof pageLocation.origin !== "string"
  ) {
    throw new Error("A page URL is required when creating a browser client")
  }
  return pageLocation.origin
}

/** Create a typed browser client without importing the API server runtime. */
export function createWebClient<TContext extends Record<string, unknown> = Record<string, never>>(
  options: WebClientOptions<TContext> = {},
): WebClient<TContext> {
  const link = new RPCLink({
    url: options.url ?? (() => new URL(API_RPC_PATH, getPageOrigin()).toString()),
    ...(options.fetch ? { fetch: options.fetch } : {}),
  })
  return createORPCClient<WebClient<TContext>>(link)
}
