import type { AnyRouter, BetterAuthOptions, DeesseConfig, ZodInput, ZodType } from "./types.js"
import type { AnyPlugin, ApiRouter, BetterAuthInstance, ComposedBetterAuthOptions, DatabaseAdapter, DeesseFetchHandler, DeesseInstance, PluginContribution, PluginDefinition, PluginRegistration } from "./types.js"

export type { BetterAuthServerInstance, CapabilitiesOf, ComposedBetterAuthOptions, DatabaseAdapter, DeesseApiOptions, DeesseBetterAuthOptions, DeesseConfig, DeesseDatabase, DeesseDatabaseAdapter, DeesseDatabaseService, DeesseFetchHandler, DeesseInstance, PluginContribution, PluginExtension } from "./types.js"

type Definition<TSchema extends ZodType, TContribution extends PluginContribution, TRequires extends readonly string[], TPoints extends Readonly<Record<string, unknown>>> =
  PluginDefinition<TSchema, TContribution, TRequires, TPoints>

export function plugin<const TId extends string, TSchema extends ZodType, TContribution extends PluginContribution,
  const TRequires extends readonly string[] = readonly [], const TPoints extends Readonly<Record<string, unknown>> = Readonly<Record<never, never>>>(
  definition: Definition<TSchema, TContribution, TRequires, TPoints> & { id: TId },
) {
  const factory = (args: ZodInput<TSchema>): PluginRegistration<typeof definition> => ({
    id: definition.id,
    args: definition.args.parse(args),
    definition,
  })
  return Object.assign(factory, { definition })
}

export function createDeesse<
  TDatabase extends DatabaseAdapter,
  TAuth extends BetterAuthOptions,
  TApi extends { router?: AnyRouter } = Record<never, never>,
  const TPlugins extends readonly AnyPlugin[] = readonly [],
>(options: DeesseConfig<TDatabase, TAuth, TApi, TPlugins>): DeesseInstance<
  TDatabase, BetterAuthInstance<ComposedBetterAuthOptions<TAuth, TPlugins>>, ApiRouter<TApi, TPlugins>
> {
  return {
    database: options.database.database,
    auth: null as unknown as BetterAuthInstance<ComposedBetterAuthOptions<TAuth, TPlugins>>,
    api: { router: null as unknown as ApiRouter<TApi, TPlugins> },
    handler: null as unknown as DeesseFetchHandler,
  }
}
