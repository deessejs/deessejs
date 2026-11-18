import type { AnyRouter, BetterAuthOptions, DeesseConfig, ZodInput, ZodType } from "./types.js"
import type { AnyPlugin, ApiRouter, BetterAuthInstance, DatabaseAdapter, DeesseFetchHandler, DeesseInstance, PluginContribution, PluginDefinition } from "./types.js"

export type { DatabaseAdapter, DeesseApiOptions, DeesseConfig, DeesseDatabase, DeesseFetchHandler, DeesseInstance, PluginContribution } from "./types.js"

export function plugin<const TId extends string, TSchema extends ZodType, TContribution extends PluginContribution>(
  definition: PluginDefinition<TSchema, TContribution> & { id: TId },
) {
  return (args: ZodInput<TSchema>) => ({
    id: definition.id,
    args: definition.args.parse(args),
    definition,
  })
}

export function createDeesse<
  TDatabase extends DatabaseAdapter,
  TAuth extends BetterAuthOptions,
  TApi extends { router?: AnyRouter } = Record<never, never>,
  const TPlugins extends readonly AnyPlugin[] = readonly [],
>(options: DeesseConfig<TDatabase, TAuth, TApi, TPlugins>): DeesseInstance<
  TDatabase["database"], BetterAuthInstance<TAuth>, ApiRouter<TApi, TPlugins>
> {
  return {
    database: options.database.database,
    auth: null as unknown as BetterAuthInstance<TAuth>,
    api: { router: null as unknown as ApiRouter<TApi, TPlugins> },
    handler: null as unknown as DeesseFetchHandler,
  }
}
