import type { BetterAuthClientOptions } from "better-auth/client"
import type { AnyRouter } from "@orpc/server"

export interface DeesseReactRegistry {
  __prototype?: never
}

export type DeesseReactApplication = DeesseReactRegistry[keyof DeesseReactRegistry] extends infer T
  ? T extends { router: infer TRouter extends AnyRouter; authOptions?: infer TAuth extends BetterAuthClientOptions }
    ? { router: TRouter; authOptions: TAuth }
    : never
  : never

export type DeesseReactAuthOptions = DeesseReactApplication extends { authOptions: infer TAuth extends BetterAuthClientOptions }
  ? TAuth
  : BetterAuthClientOptions

export type DeesseReactRouter = DeesseReactApplication extends { router: infer TRouter extends AnyRouter }
  ? TRouter
  : AnyRouter
