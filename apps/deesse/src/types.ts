import { betterAuth, type BetterAuthOptions } from "better-auth"
import type { BetterAuthPlugin } from "better-auth"
import type { BetterAuthClientPlugin } from "better-auth/client"
import type { AnyRouter } from "@orpc/server"
import type { input as ZodInput, infer as ZodOutput, ZodType } from "zod"

export interface DeesseDatabaseService<TCapabilities extends object = Record<never, never>> {
  readonly capabilities: TCapabilities
}

export interface DeesseDatabaseAdapter<
  TDatabase extends DeesseDatabaseService = DeesseDatabaseService,
  TAuthAdapter = unknown,
> {
  readonly database: TDatabase
  readonly authAdapter: TAuthAdapter
}

export type DeesseDatabase = DeesseDatabaseService
export type DatabaseAdapter<TDatabase extends DeesseDatabaseService = DeesseDatabaseService, TAuthAdapter = unknown> =
  DeesseDatabaseAdapter<TDatabase, TAuthAdapter>

export type CapabilitiesOf<TAdapter extends DeesseDatabaseAdapter> = TAdapter["database"]["capabilities"]

export type DeesseBetterAuthOptions = BetterAuthOptions
export type BetterAuthServerInstance = {
  readonly handler: (request: Request) => Promise<Response>
  readonly fetch: (request: Request) => Promise<Response>
  readonly api: object
  readonly options: BetterAuthOptions
  readonly $Infer: { readonly Session: { readonly session: object; readonly user: object } }
}

export type PluginContribution = {
  database?: { schema: unknown }
  auth?: {
    serverPlugins?: readonly BetterAuthPlugin[]
    clientPlugins?: readonly BetterAuthClientPlugin[]
  }
  api?: { router: AnyRouter }
  extensions?: Readonly<Record<string, unknown>>
}

export type PluginDefinition<
  TSchema extends ZodType,
  TContribution extends PluginContribution,
  TRequires extends readonly string[] = readonly string[],
  TExtensionPoints extends Readonly<Record<string, unknown>> = Readonly<Record<string, unknown>>,
> = {
  id: string
  args: TSchema
  requires?: TRequires
  extensionPoints?: TExtensionPoints
  handler: (args: ZodOutput<TSchema>) => TContribution
}

export type PluginRegistration<TDefinition extends { id: string; handler: (...args: never[]) => unknown }> = {
  id: TDefinition["id"]
  definition: TDefinition
} & (TDefinition extends { args: infer TSchema extends ZodType } ? { args: ZodOutput<TSchema> } : Record<never, never>)

export type AnyPlugin = PluginRegistration<{ id: string; handler: (...args: never[]) => unknown }>

export type PluginExtension<TProvider, TPoint extends string> = TProvider extends {
  definition: { extensionPoints?: infer TPoints }
} ? NonNullable<TPoints> extends infer TPointMap ? TPoint extends keyof TPointMap
  ? TPointMap[TPoint] extends ZodType ? ZodOutput<TPointMap[TPoint]> : TPointMap[TPoint]
  : never : never : never

export type ContributionOf<TPlugins extends readonly AnyPlugin[]> = TPlugins[number] extends infer TPlugin
  ? TPlugin extends { definition: { handler: (...args: never[]) => infer TContribution } } ? TContribution : never
  : never

type UnionToIntersection<TUnion> = (TUnion extends unknown ? (value: TUnion) => void : never) extends (value: infer TIntersection) => void
  ? TIntersection
  : never

type MergeContributionObjects<TObjects> = [TObjects] extends [never]
  ? Record<never, never>
  : { [TKey in keyof UnionToIntersection<TObjects>]: UnionToIntersection<TObjects>[TKey] }

type DatabaseSchemaContribution<TContribution> = TContribution extends { database: { schema: infer TSchema extends object } }
  ? TSchema
  : never

type ExtensionContribution<TContribution> = TContribution extends { extensions: infer TExtensions extends object }
  ? TExtensions
  : never

export type AppAuthPlugin<TAuth extends BetterAuthOptions> = NonNullable<TAuth["plugins"]>[number]
export type PluginAuthServerPlugin<TPlugins extends readonly AnyPlugin[]> = ContributionOf<TPlugins> extends infer TContribution
  ? TContribution extends { auth: { serverPlugins: readonly (infer TPlugin)[] } } ? Extract<TPlugin, BetterAuthPlugin> : never
  : never
export type PluginAuthClientPlugin<TPlugins extends readonly AnyPlugin[]> = ContributionOf<TPlugins> extends infer TContribution
  ? TContribution extends { auth: { clientPlugins: readonly (infer TPlugin)[] } } ? Extract<TPlugin, BetterAuthClientPlugin> : never
  : never
export type ComposedBetterAuthOptions<TAuth extends BetterAuthOptions, TPlugins extends readonly AnyPlugin[]> =
  Omit<TAuth, "plugins"> & { plugins: Array<AppAuthPlugin<TAuth> | PluginAuthServerPlugin<TPlugins>> }

export type DeesseApiOptions = { router?: AnyRouter; [key: string]: unknown }

export type DeesseConfig<
  TDatabaseAdapter extends DeesseDatabaseAdapter,
  TAuthOptions extends DeesseBetterAuthOptions,
  TApiOptions extends DeesseApiOptions = DeesseApiOptions,
  TPlugins extends readonly AnyPlugin[] = readonly [],
> = {
  database: TDatabaseAdapter
  auth: TAuthOptions
  api?: TApiOptions
  plugins?: TPlugins
}

type PluginRouter<TPlugin> = TPlugin extends { definition: { handler: (...args: never[]) => infer TContribution } }
  ? TContribution extends { api: { router: infer TRouter extends AnyRouter } } ? TRouter : never
  : never

export type PluginRouters<TPlugins extends readonly AnyPlugin[]> = {
  [TPlugin in TPlugins[number] as [PluginRouter<TPlugin>] extends [never] ? never : TPlugin["id"]]: PluginRouter<TPlugin>
}

export type DeessePluginContributionRegistry<TPlugins extends readonly AnyPlugin[]> = {
  readonly database: MergeContributionObjects<DatabaseSchemaContribution<ContributionOf<TPlugins>>>
  readonly auth: {
    readonly serverPlugins: readonly PluginAuthServerPlugin<TPlugins>[]
    readonly clientPlugins: readonly PluginAuthClientPlugin<TPlugins>[]
  }
  readonly api: PluginRouters<TPlugins>
  readonly extensions: MergeContributionObjects<ExtensionContribution<ContributionOf<TPlugins>>>
}

export type ApiRouter<TApi, TPlugins extends readonly AnyPlugin[]> =
  (TApi extends { router: infer TRouter extends AnyRouter } ? TRouter : Record<never, never>) & PluginRouters<TPlugins>

export type DeesseFetchHandler = (request: Request) => Promise<Response>

export type DeesseInstance<
  TAdapter extends DeesseDatabaseAdapter,
  TAuth extends BetterAuthServerInstance,
  TApiRouter,
> = {
  readonly database: DeesseDatabaseService<CapabilitiesOf<TAdapter>>
  readonly auth: TAuth
  readonly api: { readonly router: TApiRouter }
  readonly handler: DeesseFetchHandler
}

export type BetterAuthInstance<TOptions extends BetterAuthOptions> = ReturnType<typeof betterAuth<TOptions>>
export type { AnyRouter, BetterAuthOptions, ZodInput, ZodType }
