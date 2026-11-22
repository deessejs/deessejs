import type { AnyRouter } from "@orpc/server"
import type { BetterAuthClientOptions, BetterAuthClientPlugin } from "better-auth/client"

export type DeesseClientServer = {
  readonly api: {
    readonly router: AnyRouter
  }
}

export type DeesseClientPlugin<TServer extends DeesseClientServer> = BetterAuthClientPlugin & {
  readonly $InferServerPlugin?: {
    readonly deesse: TServer
  }
}

export type DeesseClientOptions = BetterAuthClientOptions & {
  baseURL?: string
  fetch?: typeof globalThis.fetch
}

type ServerFromClientPlugin<TPlugin> = TPlugin extends {
  readonly $InferServerPlugin?: {
    readonly deesse: infer TServer extends DeesseClientServer
  }
} ? TServer : never

type ServerFromClientPlugins<TPlugins> = TPlugins extends readonly (infer TPlugin)[]
  ? ServerFromClientPlugin<TPlugin>
  : never

export type DeesseRouterFromClientOptions<TOptions extends DeesseClientOptions> =
  ServerFromClientPlugins<TOptions["plugins"]> extends infer TServer
    ? [TServer] extends [never]
      ? AnyRouter
      : TServer extends DeesseClientServer
        ? TServer["api"]["router"]
        : AnyRouter
    : AnyRouter
