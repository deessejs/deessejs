import type { AnyRouter } from "@orpc/server"
import type { BetterAuthClientOptions } from "better-auth/client"

type DeesseServerSource = {
  readonly api: {
    readonly router: AnyRouter
  }
}

export type DeesseServer<TServer extends DeesseServerSource = DeesseServerSource> = {
  readonly api: {
    readonly router: TServer["api"]["router"]
  }
}

declare const serverTypeReference: unique symbol

export type DeesseServerReference<TServer extends DeesseServer> = {
  readonly [serverTypeReference]: TServer
}

export type DeesseClientOptions = {
  server: DeesseServerReference<DeesseServer>
  auth?: BetterAuthClientOptions
  baseURL?: string
  fetch?: typeof globalThis.fetch
}

type ServerFromOptions<TOptions extends DeesseClientOptions> = TOptions["server"] extends DeesseServerReference<infer TServer> ? TServer : DeesseServer

type AuthOptionsFromOptions<TOptions extends DeesseClientOptions> = TOptions extends {
  readonly auth: infer TAuthOptions extends BetterAuthClientOptions
} ? TAuthOptions : BetterAuthClientOptions

export type DeesseClientAuth<TOptions extends DeesseClientOptions> = AuthOptionsFromOptions<TOptions>

export type DeesseClientRouter<TOptions extends DeesseClientOptions> = ServerFromOptions<TOptions>["api"]["router"]
