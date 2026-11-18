import { createAuthClient, type ReactAuthClient } from "better-auth/react"
import type { RouterClient } from "@orpc/server"
import type { DeesseReactAuthOptions, DeesseReactRouter } from "./react-types.js"

export type { DeesseReactAuthOptions, DeesseReactRegistry, DeesseReactRouter } from "./react-types.js"

export function createClient(): { auth: ReactAuthClient<DeesseReactAuthOptions>; api: RouterClient<DeesseReactRouter> } {
  const auth = createAuthClient<DeesseReactAuthOptions>()
  return { auth, api: null as unknown as RouterClient<DeesseReactRouter> }
}
