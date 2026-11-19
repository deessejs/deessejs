import type { AnyRouter, BetterAuthOptions, DeesseConfig, ZodInput, ZodType } from "./types.js"
import type { AnyPlugin, ApiRouter, BetterAuthInstance, ComposedBetterAuthOptions, DeesseDatabaseAdapterContract, DeesseInstance, PluginContribution, PluginDefinition, PluginRegistration } from "./types.js"
import { createRuntime } from "./runtime.js"
import type { RuntimeOptions } from "./runtime-types.js"

export type { BoundedLimit, BetterAuthServerInstance, CapabilitiesOf, ComposedBetterAuthOptions, ComposedDatabaseSchema, DatabaseAdapter, DeesseApiOptions, DeesseAuthAdapter, DeesseAuthSchema, DeesseBetterAuthOptions, DeesseConfig, DeesseDatabase, DeesseDatabaseAdapter, DeesseDatabaseAdapterContract, DeesseDatabaseCapabilities, DeesseDatabaseFailure, DeesseDatabaseSchema, DeesseDatabaseService, DeesseFetchHandler, DeesseFieldDefinition, DeesseFieldType, DeesseFindManyOptions, DeesseIndexDefinition, DeesseInsert, DeesseInstance, DeesseJsonValue, DeesseModelDefinition, DeesseModelResult, DeesseModelRow, DeesseNotFound, DeessePatch, DeessePluginContributionRegistry, DeesseRequestContext, DeesseResult, DeesseTransactionService, PluginContribution, PluginExtension } from "./types.js"

type Definition<TSchema extends ZodType, TContribution extends PluginContribution, TRequires extends readonly string[], TPoints extends Readonly<Record<string, unknown>>> =
  PluginDefinition<TSchema, TContribution, TRequires, TPoints>

type NoArgsRegistration<TDefinition extends { id: string; handler: () => PluginContribution }> = { id: TDefinition["id"]; definition: TDefinition }

export function plugin<const TDefinition extends { id: string; args?: never; requires?: readonly string[]; extensionPoints?: Readonly<Record<string, unknown>>; handler: () => PluginContribution }>(
  definition: TDefinition,
): (() => NoArgsRegistration<TDefinition>) & { definition: TDefinition }
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
  TDatabase extends DeesseDatabaseAdapterContract,
  TAuth extends BetterAuthOptions,
  TApi extends { router?: AnyRouter } = Record<never, never>,
  const TPlugins extends readonly AnyPlugin[] = readonly [],
>(options: DeesseConfig<TDatabase, TAuth, TApi, TPlugins>): DeesseInstance<
  TDatabase, BetterAuthInstance<ComposedBetterAuthOptions<TAuth, TPlugins>>, ApiRouter<TApi, TPlugins>, TPlugins
> {
  return createRuntime(options as unknown as RuntimeOptions) as unknown as DeesseInstance<
    TDatabase,
    BetterAuthInstance<ComposedBetterAuthOptions<TAuth, TPlugins>>,
    ApiRouter<TApi, TPlugins>,
    TPlugins
  >
}
