import type { BetterAuthClientOptions } from "better-auth/client"
import type { AnyRouter } from "@orpc/server"

export type DeesseClientServer = {
  readonly api: {
    readonly router: AnyRouter
  }
}

export type DeesseClientOptions<
  TAuthOptions extends BetterAuthClientOptions = BetterAuthClientOptions,
> = {
  auth?: TAuthOptions
  baseURL?: string
  fetch?: typeof globalThis.fetch
}
