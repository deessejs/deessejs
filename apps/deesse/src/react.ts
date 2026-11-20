import { createAuthClient, type ReactAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { DEESSE_RPC_PATH } from "./paths.js"
import type { DeesseClientOptions, DeesseClientServer } from "./react-types.js"

export type { DeesseClientOptions, DeesseClientServer } from "./react-types.js"

export function createClient<
  TServer extends DeesseClientServer = DeesseClientServer,
>() {
  return function createBoundClient<TAuthOptions extends BetterAuthClientOptions = BetterAuthClientOptions>(options: DeesseClientOptions<TAuthOptions> = {}) {
    const location = (globalThis as { location?: { origin: string } }).location
    const baseURL = options.baseURL ?? location?.origin ?? "http://localhost"
    const clientOptions = { baseURL, ...(options.fetch ? { fetch: options.fetch } : {}) }
    const auth = createAuthClient<TAuthOptions>({ ...options.auth, ...clientOptions } as BetterAuthClientOptions & TAuthOptions)
    const link = new RPCLink({ url: new URL(DEESSE_RPC_PATH, baseURL).toString(), ...(options.fetch ? { fetch: options.fetch } : {}) })
    return { auth, api: createORPCClient(link) as RouterClient<TServer["api"]["router"]> }
  }
}
