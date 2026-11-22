import { createAuthClient } from "better-auth/react"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { DEESSE_RPC_PATH } from "./paths.js"
import type { DeesseClientOptions, DeesseClientPlugin, DeesseClientServer, DeesseRouterFromClientOptions } from "./react-types.js"

export type { DeesseClientOptions, DeesseClientPlugin, DeesseClientServer, DeesseRouterFromClientOptions } from "./react-types.js"

export function deesseClient<TServer extends DeesseClientServer>(): DeesseClientPlugin<TServer> {
  return { id: "deesse-client" } as DeesseClientPlugin<TServer>
}

export function createClient<TOptions extends DeesseClientOptions = DeesseClientOptions>(options: TOptions = {} as TOptions) {
  const location = (globalThis as { location?: { origin: string } }).location
  const baseURL = options.baseURL ?? location?.origin ?? "http://localhost"
  const authOptions = { ...options, baseURL } as TOptions
  const auth = createAuthClient<TOptions>(authOptions)
  const link = new RPCLink({ url: new URL(DEESSE_RPC_PATH, baseURL).toString(), ...(options.fetch ? { fetch: options.fetch } : {}) })
  return { auth, api: createORPCClient(link) as RouterClient<DeesseRouterFromClientOptions<TOptions>> }
}
