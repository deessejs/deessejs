import { createAuthClient } from "better-auth/react"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { DEESSE_RPC_PATH } from "./paths.js"
import type { DeesseClientAuth, DeesseClientOptions, DeesseClientRouter, DeesseServer, DeesseServerReference } from "./react-types.js"

export type { DeesseClientOptions, DeesseServer } from "./react-types.js"

export function deesseServer<TServer extends DeesseServer>(): DeesseServerReference<DeesseServer<TServer>> {
  return {} as DeesseServerReference<DeesseServer<TServer>>
}

export function createClient<const TOptions extends DeesseClientOptions>(options: TOptions) {
  const location = (globalThis as { location?: { origin: string } }).location
  const baseURL = options.baseURL ?? location?.origin ?? "http://localhost"
  const authOptions = { ...options.auth, baseURL, ...(options.fetch ? { fetch: options.fetch } : {}) } as DeesseClientAuth<TOptions>
  const auth = createAuthClient<DeesseClientAuth<TOptions>>(authOptions)
  const link = new RPCLink({ url: new URL(DEESSE_RPC_PATH, baseURL).toString(), ...(options.fetch ? { fetch: options.fetch } : {}) })
  return { auth, api: createORPCClient(link) as RouterClient<DeesseClientRouter<TOptions>> }
}
