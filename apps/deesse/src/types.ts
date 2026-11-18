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

export type DeesseApiOptions = { router?: AnyRouter }

export type DeesseConfig<
  TDatabaseAdapter extends DatabaseAdapter,
  TAuthOptions extends BetterAuthOptions,
  TApiOptions extends DeesseApiOptions = DeesseApiOptions,
  TPlugins extends readonly AnyPlugin[] = readonly [],
> = {
  database: TDatabaseAdapter
  auth: TAuthOptions
  api?: TApiOptions
  plugins?: TPlugins
}

export type PluginRouters<TPlugins extends readonly AnyPlugin[]> = {
  [TPlugin in TPlugins[number] as TPlugin["id"]]: ReturnType<TPlugin["definition"]["handler"]> extends { api: { router: infer TRouter } } ? TRouter : never
}

export type ApiRouter<TApi, TPlugins extends readonly AnyPlugin[]> =
  (TApi extends { router: infer TRouter extends AnyRouter } ? TRouter : Record<never, never>) & PluginRouters<TPlugins>

export type DeesseFetchHandler = (request: Request) => Promise<Response>

export type DeesseInstance<TDatabase extends DeesseDatabase, TAuth, TApiRouter> = {
  readonly database: TDatabase
  readonly auth: TAuth
  readonly api: { readonly router: TApiRouter }
  readonly handler: DeesseFetchHandler
}

export type BetterAuthInstance<TOptions extends BetterAuthOptions> = ReturnType<typeof betterAuth<TOptions>>
export type { AnyRouter, BetterAuthOptions, ZodInput, ZodType }
