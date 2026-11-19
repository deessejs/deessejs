import { createAuthClient, type ReactAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { DEESSE_RPC_PATH } from "./paths.js"
import type { DeesseClientOptions, DeesseReactAuthOptions, DeesseReactRouter } from "./react-types.js"

export type { DeesseClientOptions, DeesseReactAuthOptions, DeesseReactRegistry, DeesseReactRouter } from "./react-types.js"

export function createClient(options: DeesseClientOptions = {}): { auth: ReactAuthClient<DeesseReactAuthOptions>; api: RouterClient<DeesseReactRouter> } {
  const location = (globalThis as { location?: { origin: string } }).location
  const baseURL = options.baseURL ?? location?.origin ?? "http://localhost"
  const clientOptions = { baseURL, ...(options.fetch ? { fetch: options.fetch } : {}) }
  const auth = createAuthClient<DeesseReactAuthOptions>(clientOptions as BetterAuthClientOptions & DeesseReactAuthOptions)
  const link = new RPCLink({ url: new URL(DEESSE_RPC_PATH, baseURL).toString(), ...(options.fetch ? { fetch: options.fetch } : {}) })
  return { auth, api: createORPCClient(link) as RouterClient<DeesseReactRouter> }
}
