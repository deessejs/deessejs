import { createAuthClient } from "better-auth/react"
import type { RouterClient } from "@orpc/server"
import type { DeesseReactAuthOptions, DeesseReactRouter } from "./react-types.js"

export type { DeesseReactRegistry } from "./react-types.js"

export function createClient() {
  const auth = createAuthClient<DeesseReactAuthOptions>()
  return { auth, api: null as unknown as RouterClient<DeesseReactRouter> }
}
