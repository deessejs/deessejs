import type { BetterAuthOptions, DatabaseAdapter, DeesseApiOptions, PluginOutput, ZodType } from "./types.js"

export type RuntimePlugin = {
  id: string
  args?: unknown
  definition: {
    args?: ZodType
    requires?: readonly string[]
    handler: ((args: never) => PluginOutput) | (() => PluginOutput)
  }
}

export type RuntimeOptions = {
  database: DatabaseAdapter
  auth: BetterAuthOptions
  api?: DeesseApiOptions
  plugins?: readonly RuntimePlugin[]
}

export type DeesseHost = { readonly handler: (request: Request) => Promise<Response> }
