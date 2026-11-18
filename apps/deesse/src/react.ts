import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import type { RouterClient } from "@orpc/server"
import type { AnyRouter } from "@orpc/server"

export interface DeesseReactRegistry {
  __prototype?: never
}

type AppTypes = DeesseReactRegistry[keyof DeesseReactRegistry] extends infer T
  ? T extends { router: infer TRouter extends AnyRouter; authOptions?: infer TAuth extends BetterAuthClientOptions }
    ? { router: TRouter; authOptions: TAuth }
    : never
  : never

export function createClient() {
  const auth = createAuthClient<AppTypes extends { authOptions: infer TAuth extends BetterAuthClientOptions } ? TAuth : BetterAuthClientOptions>()
  return { auth, api: null as unknown as RouterClient<AppTypes extends { router: infer TRouter extends AnyRouter } ? TRouter : AnyRouter> }
}
