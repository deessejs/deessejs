import type { BetterAuthOptions, DatabaseAdapter, DeesseApiOptions, PluginContribution } from "./types.js"

export type RuntimePlugin = {
  id: string
  args?: unknown
  definition: {
    requires?: readonly string[]
    handler: ((args: never) => PluginContribution) | (() => PluginContribution)
  }
}

export type RuntimeOptions = {
  database: DatabaseAdapter
  auth: BetterAuthOptions
  api?: DeesseApiOptions
  plugins?: readonly RuntimePlugin[]
}

export type DeesseHost = { readonly handler: (request: Request) => Promise<Response> }
