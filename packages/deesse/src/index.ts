import type { BetterAuthOptions } from "better-auth"
import type { AnyRouter } from "@orpc/server"
import type { ZodType } from "zod"

/** Portable database operations. Provider clients remain inside adapter implementations. */
export interface DeesseDatabase {
  readonly capabilities: { readonly transactions: boolean }
}

export interface DatabaseAdapter<TDatabase extends DeesseDatabase = DeesseDatabase, TAuthAdapter = unknown> {
  readonly database: TDatabase
  readonly authAdapter: TAuthAdapter
}

export type PluginContribution<TRouter extends AnyRouter = AnyRouter> = {
  api?: { router: TRouter }
  auth?: { serverPlugins?: readonly unknown[] }
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

export function createDeesse<
  TDatabase extends DatabaseAdapter,
  TAuth extends BetterAuthOptions,
  TApi extends { router?: AnyRouter },
  const TPlugins extends readonly AnyPlugin[],
>(options: { database: TDatabase; auth: TAuth; api: TApi; plugins: TPlugins }) {
  return {
    options,
    types: null as unknown as { router: TApi["router"] extends AnyRouter ? TApi["router"] & PluginRouters<TPlugins> : PluginRouters<TPlugins> },
  }
}
