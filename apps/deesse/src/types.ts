import { betterAuth, type BetterAuthOptions } from "better-auth"
import type { AnyRouter } from "@orpc/server"
import type { input as ZodInput, infer as ZodOutput, ZodType } from "zod"

export interface DeesseDatabase {
  readonly capabilities: { readonly transactions: boolean }
}

export interface DatabaseAdapter<TDatabase extends DeesseDatabase = DeesseDatabase, TAuthAdapter = unknown> {
  readonly database: TDatabase
  readonly authAdapter: TAuthAdapter
}

export type PluginContribution<TRouter extends AnyRouter = AnyRouter> = {
  api?: { router: TRouter }
}

export type PluginDefinition<TSchema extends ZodType, TContribution extends PluginContribution> = {
  id: string
  args: TSchema
  handler: (args: ZodOutput<TSchema>) => TContribution
}

export type AnyPlugin = { id: string; definition: { handler: (...args: never[]) => unknown } }

export type PluginRouters<TPlugins extends readonly AnyPlugin[]> = {
  [TPlugin in TPlugins[number] as TPlugin["id"]]: ReturnType<TPlugin["definition"]["handler"]> extends { api: { router: infer TRouter } } ? TRouter : never
}

export type ApiRouter<TApi, TPlugins extends readonly AnyPlugin[]> =
  (TApi extends { router: infer TRouter extends AnyRouter } ? TRouter : Record<never, never>) & PluginRouters<TPlugins>

export type DeesseInstance<TDatabase extends DeesseDatabase, TAuth, TApiRouter> = {
  database: TDatabase
  auth: TAuth
  api: { router: TApiRouter }
}

export type BetterAuthInstance<TOptions extends BetterAuthOptions> = ReturnType<typeof betterAuth<TOptions>>
export type { AnyRouter, BetterAuthOptions, ZodInput, ZodType }
