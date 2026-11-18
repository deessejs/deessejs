import type { AnyRouter, BetterAuthOptions, DeesseConfig, ZodInput, ZodType } from "./types.js"
import type { AnyPlugin, ApiRouter, BetterAuthInstance, ComposedBetterAuthOptions, DatabaseAdapter, DeesseFetchHandler, DeesseInstance, PluginContribution, PluginDefinition, PluginRegistration } from "./types.js"

export type { BetterAuthServerInstance, CapabilitiesOf, ComposedBetterAuthOptions, DatabaseAdapter, DeesseApiOptions, DeesseBetterAuthOptions, DeesseConfig, DeesseDatabase, DeesseDatabaseAdapter, DeesseDatabaseService, DeesseFetchHandler, DeesseInstance, DeessePluginContributionRegistry, PluginContribution, PluginExtension } from "./types.js"

type Definition<TSchema extends ZodType, TContribution extends PluginContribution, TRequires extends readonly string[], TPoints extends Readonly<Record<string, unknown>>> =
  PluginDefinition<TSchema, TContribution, TRequires, TPoints>

type NoArgsRegistration<TId extends string, TContribution extends PluginContribution> = { id: TId; definition: { id: TId; handler: () => TContribution } }

export function plugin<const TId extends string, TContribution extends PluginContribution>(definition: { id: TId; handler: () => TContribution; args?: never }): (() => NoArgsRegistration<TId, TContribution>) & { definition: typeof definition }
export function plugin<const TId extends string, TSchema extends ZodType, TContribution extends PluginContribution,
  const TRequires extends readonly string[] = readonly [], const TPoints extends Readonly<Record<string, unknown>> = Readonly<Record<never, never>>>(
  definition: Definition<TSchema, TContribution, TRequires, TPoints> & { id: TId },
): ((args: ZodInput<TSchema>) => PluginRegistration<typeof definition>) & { definition: typeof definition }
export function plugin(definition: { id: string; args?: ZodType; handler: ((args: never) => PluginContribution) | (() => PluginContribution) }) {
  const factory = (args?: unknown) => definition.args
    ? { id: definition.id, args: definition.args.parse(args), definition }
    : { id: definition.id, definition }
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
