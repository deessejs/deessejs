import { createAuthClient } from "better-auth/react"
import type { RouterClient } from "@orpc/server"
import type { AnyRouter } from "@orpc/server"

/** Type-only bridge for a server instance. No server runtime enters the client bundle. */
export function createClient<TRouter extends AnyRouter>() {
  const auth = createAuthClient()
  return { auth, api: null as unknown as RouterClient<TRouter> }
}
