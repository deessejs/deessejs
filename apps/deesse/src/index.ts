import type { AnyRouter, BetterAuthOptions, DeesseConfig, ZodInput, ZodType } from "./types.js"
import type { AnyPlugin, ApiRouter, BetterAuthInstance, ComposedBetterAuthOptions, DeesseDatabaseAdapterContract, DeesseInstance, PluginOutput } from "./types.js"
import { createRuntime } from "./runtime.js"
export { createPluginApi } from "./plugin-api.js"
export { resolveAdminAccess, type AdminAccess } from "./admin-access.js"
import type { RuntimeOptions } from "./runtime-types.js"
import type { ConfiguredRegistration, Definition, NoArgsRegistration } from "./index.types.js"

export type { ApiRouter, BetterAuthInstance, BoundedLimit, BetterAuthServerInstance, CapabilitiesOf, ComposedBetterAuthOptions, ComposedDatabaseSchema, DatabaseAdapter, DeesseApiOptions, DeesseAuthAdapter, DeesseAuthSchema, DeesseBetterAuthOptions, DeesseConfig, DeesseDatabase, DeesseDatabaseAdapter, DeesseDatabaseAdapterContract, DeesseDatabaseCapabilities, DeesseDatabaseErrorCode, DeesseDatabaseErrorFields, DeesseDatabaseFailure, DeesseDatabaseOperations, DeesseDatabaseResult, DeesseDatabaseSchema, DeesseDatabaseService, DeesseFetchHandler, DeesseFieldDefinition, DeesseFieldType, DeesseFindManyOptions, DeesseIndexDefinition, DeesseInsert, DeesseInstance, DeesseJsonValue, DeesseModelDefinition, DeesseModelResult, DeesseModelRow, DeesseNotFound, DeessePatch, DeessePluginContributionRegistry, DeesseRequestContext, DeesseRequestUser, DeesseTransactionService, ImmutablePluginOutput, PluginContribution, PluginDefinition, PluginExtension, PluginOutput, PluginOutputEntry, PluginOutputOf, PluginOutputRegistry } from "./types.js"
export type { ConfiguredRegistration, Definition, NoArgsRegistration } from "./index.types.js"

export function plugin<const TDefinition extends { id: string; args?: never; requires?: readonly string[]; extensionPoints?: Readonly<Record<string, unknown>>; handler: () => PluginOutput }>(
  definition: TDefinition,
): (() => NoArgsRegistration<TDefinition>) & { definition: TDefinition }
export function plugin<const TId extends string, TSchema extends ZodType, TContribution extends PluginOutput,
  const TRequires extends readonly string[] = readonly [], const TPoints extends Readonly<Record<string, unknown>> = Readonly<Record<never, never>>>(
  definition: Definition<TSchema, TContribution, TRequires, TPoints> & { id: TId },
): ((args: ZodInput<TSchema>) => ConfiguredRegistration<typeof definition>) & { definition: typeof definition }
export function plugin(definition: { id: string; args?: ZodType; handler: ((args: never) => PluginOutput) | (() => PluginOutput) }) {
  const factory = (args?: unknown) => definition.args
    ? { id: definition.id, args, definition }
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
