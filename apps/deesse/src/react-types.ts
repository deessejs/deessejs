import type { BetterAuthClientOptions } from "better-auth/client"
import type { AnyRouter } from "@orpc/server"

export interface DeesseReactRegistry {
  __prototype?: never
}

type RegistryEntry = DeesseReactRegistry[keyof DeesseReactRegistry]
type AuthOptionsFrom<T> = T extends { authOptions: infer TAuth } ? TAuth : never
type RouterFrom<T> = T extends { router: infer TRouter extends AnyRouter } ? TRouter : never
type RegisteredAuthOptions = AuthOptionsFrom<RegistryEntry>
type RegisteredRouter = RouterFrom<RegistryEntry>

export type DeesseReactAuthOptions = [RegisteredAuthOptions] extends [never] ? BetterAuthClientOptions : RegisteredAuthOptions
export type DeesseReactRouter = [RegisteredRouter] extends [never] ? AnyRouter : RegisteredRouter
