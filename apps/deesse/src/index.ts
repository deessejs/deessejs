import { betterAuth, type BetterAuthOptions } from "better-auth"
import type { AnyRouter } from "@orpc/server"
import type { ZodType } from "zod"

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

type PluginDefinition<TSchema extends ZodType, TContribution extends PluginContribution> = {
  id: string
  args: TSchema
  handler: (args: import("zod").infer<TSchema>) => TContribution
}

export function plugin<const TId extends string, TSchema extends ZodType, TContribution extends PluginContribution>(
  definition: PluginDefinition<TSchema, TContribution> & { id: TId },
) {
  return (args: import("zod").input<TSchema>) => ({
    id: definition.id,
    args: definition.args.parse(args),
    definition,
  })
}

type AnyPlugin = { id: string; definition: { handler: (...args: never[]) => unknown } }
type PluginRouters<TPlugins extends readonly AnyPlugin[]> = {
  [TPlugin in TPlugins[number] as TPlugin["id"]]: ReturnType<TPlugin["definition"]["handler"]> extends { api: { router: infer TRouter } } ? TRouter : never
}

type ApiRouter<TApi, TPlugins extends readonly AnyPlugin[]> =
  (TApi extends { router: infer TRouter extends AnyRouter } ? TRouter : Record<never, never>) & PluginRouters<TPlugins>

export type DeesseInstance<TDatabase extends DeesseDatabase, TAuth, TApiRouter> = {
  database: TDatabase
  auth: TAuth
  api: { router: TApiRouter }
}

type BetterAuthInstance<TOptions extends BetterAuthOptions> = ReturnType<typeof betterAuth<TOptions>>

export function createDeesse<
  TDatabase extends DatabaseAdapter,
  TAuth extends BetterAuthOptions,
  TApi extends { router?: AnyRouter } = Record<never, never>,
  const TPlugins extends readonly AnyPlugin[] = [],
>(options: { database: TDatabase; auth: TAuth; api?: TApi; plugins?: TPlugins }): DeesseInstance<
  TDatabase["database"],
  BetterAuthInstance<TAuth>,
  ApiRouter<TApi, TPlugins>
> {
  return {
    database: options.database.database,
    auth: null as unknown as BetterAuthInstance<TAuth>,
    api: { router: null as unknown as ApiRouter<TApi, TPlugins> },
  }
}
