import { betterAuth, type BetterAuthOptions } from "better-auth"
import type { BetterAuthPlugin } from "better-auth"
import type { BetterAuthClientPlugin } from "better-auth/client"
import type { AnyRouter } from "@orpc/server"
import type { ErrorInstance } from "@deessejs/errors"
import type { Result } from "@deessejs/fp"
import type { input as ZodInput, infer as ZodOutput, ZodType } from "zod"

export type DeesseFieldType = "string" | "text" | "integer" | "boolean" | "timestamp" | "date" | "json"
export type DeesseJsonValue = string | number | boolean | null | DeesseJsonValue[] | { [key: string]: DeesseJsonValue }
export type DeesseFieldDefinition = {
  nullable?: boolean
  unique?: boolean
  columnName?: string
} & (
  | { type: "string" | "text"; default?: string }
  | { type: "integer"; default?: number }
  | { type: "boolean"; default?: boolean }
  | { type: "timestamp"; default?: string }
  | { type: "date"; default?: string }
  | { type: "json"; default?: DeesseJsonValue }
)
export type DeesseIndexDefinition = { name?: string; fields: readonly string[]; unique?: boolean }
export type DeesseModelDefinition = { fields: Record<string, DeesseFieldDefinition>; indexes?: readonly DeesseIndexDefinition[] }
export type DeesseDatabaseSchema = Record<string, DeesseModelDefinition>

type FieldValue<TField extends DeesseFieldDefinition> =
  [DeesseFieldType] extends [TField["type"]] ? unknown
    : TField["type"] extends "string" | "text" ? string
    : TField["type"] extends "integer" ? number
      : TField["type"] extends "boolean" ? boolean
        : TField["type"] extends "timestamp" ? Date
          : TField["type"] extends "date" ? string
          : DeesseJsonValue
type RowFieldValue<TField extends DeesseFieldDefinition> = TField["nullable"] extends true
  ? FieldValue<TField> | null
  : FieldValue<TField>
export type DeesseModelRow<TModel extends DeesseModelDefinition> = { id: string } & {
  [TKey in keyof TModel["fields"]]: RowFieldValue<TModel["fields"][TKey]>
}
type InsertRequiredKeys<TModel extends DeesseModelDefinition> = {
  [TKey in keyof TModel["fields"]]-?: TModel["fields"][TKey] extends { nullable: true } ? never
    : TModel["fields"][TKey] extends { default: unknown } ? never
      : TKey
}[keyof TModel["fields"]]
export type DeesseInsert<TModel extends DeesseModelDefinition> =
  Pick<{ [TKey in keyof TModel["fields"]]: FieldValue<TModel["fields"][TKey]> | (TModel["fields"][TKey]["nullable"] extends true ? null : never) }, InsertRequiredKeys<TModel>> &
  Partial<Omit<{ [TKey in keyof TModel["fields"]]: FieldValue<TModel["fields"][TKey]> | (TModel["fields"][TKey]["nullable"] extends true ? null : never) }, InsertRequiredKeys<TModel>>>
export type DeessePatch<TModel extends DeesseModelDefinition> = Partial<Omit<DeesseModelRow<TModel>, "id">>
type FilterValue<TValue> = TValue | { in: readonly TValue[] }
export type DeesseFindManyOptions<TRow extends object> = {
  where?: { [TKey in keyof TRow]?: FilterValue<TRow[TKey]> }
  orderBy?: Partial<Record<keyof TRow, "asc" | "desc">>
  limit?: BoundedLimit
}
type BuildNumericRange<TEnd extends number, TValues extends number[] = []> =
  TValues["length"] extends TEnd ? TValues[number] : BuildNumericRange<TEnd, [...TValues, TValues["length"]]>
export type BoundedLimit = Exclude<BuildNumericRange<101>, 0>

export type DeesseDatabaseErrorCode = "VALIDATION" | "NOT_FOUND" | "CONFLICT" | "UNSUPPORTED_CAPABILITY" | "INFRASTRUCTURE"
export type DeesseDatabaseErrorFields =
  | { code: "NOT_FOUND"; message: string; model: string; id: string }
  | { code: Exclude<DeesseDatabaseErrorCode, "NOT_FOUND">; message: string; model?: string; id?: string }
type ModelErrorFields<TModel extends string> = Exclude<DeesseDatabaseErrorFields, { code: "NOT_FOUND" }> |
  { code: "NOT_FOUND"; message: string; model: TModel; id: string }
type ErrorForFields<TFields> = TFields extends Record<string, unknown> ? ErrorInstance<TFields> : never
export type DeesseDatabaseFailure<TModel extends string = string> = ErrorForFields<ModelErrorFields<TModel>>
export type DeesseNotFound<TModel extends string = string> = ErrorInstance<{ code: "NOT_FOUND"; message: string; model: TModel; id: string }>
export type DeesseDatabaseResult<TValue> = Result<TValue, DeesseDatabaseFailure>
export type DeesseModelResult<_TModel extends string, TValue> = DeesseDatabaseResult<TValue>
export type DeesseDatabaseCapabilities = { transactions: true }
export type DeesseDatabaseOperations<TSchema extends DeesseDatabaseSchema> = {
  findById<TModel extends keyof TSchema & string>(model: TModel, id: string): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>>
  findMany<TModel extends keyof TSchema & string>(model: TModel, options?: DeesseFindManyOptions<DeesseModelRow<TSchema[TModel]>>): Promise<DeesseDatabaseResult<DeesseModelRow<TSchema[TModel]>[]>>
  insert<TModel extends keyof TSchema & string>(model: TModel, values: DeesseInsert<TSchema[TModel]>): Promise<DeesseDatabaseResult<DeesseModelRow<TSchema[TModel]>>>
  updateById<TModel extends keyof TSchema & string>(model: TModel, id: string, patch: DeessePatch<TSchema[TModel]>): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>>
  deleteById<TModel extends keyof TSchema & string>(model: TModel, id: string): Promise<DeesseModelResult<TModel, DeesseModelRow<TSchema[TModel]>>>
}
export type DeesseTransactionService<TSchema extends DeesseDatabaseSchema, TCapabilities extends object> =
  DeesseDatabaseOperations<TSchema> & { readonly capabilities: TCapabilities }
export type DeesseDatabaseService<TSchema extends DeesseDatabaseSchema = never, TCapabilities extends object = DeesseDatabaseCapabilities> =
  DeesseDatabaseOperations<TSchema> & {
    readonly capabilities: TCapabilities
    transaction<TValue>(callback: (transaction: DeesseTransactionService<TSchema, TCapabilities>) => Promise<Result<TValue, DeesseDatabaseFailure>>): Promise<Result<TValue, DeesseDatabaseFailure>>
  }
export type DeesseDatabase = DeesseDatabaseService<never, DeesseDatabaseCapabilities>
export type DeesseAuthAdapter = NonNullable<BetterAuthOptions["database"]>
export type DeesseDatabaseAdapter<
  TSchema extends DeesseDatabaseSchema = never,
  TCapabilities extends object = DeesseDatabaseCapabilities,
> = {
  readonly database: DeesseDatabaseService<TSchema, TCapabilities>
  readonly authAdapter: DeesseAuthAdapter
  initializeSchema?(schema: DeesseDatabaseSchema): void
}
export type DeesseDatabaseAdapterContract = {
  readonly database: DeesseDatabaseService<never, object>
  readonly authAdapter: DeesseAuthAdapter
  initializeSchema?(schema: DeesseDatabaseSchema): void
}
export type DatabaseAdapter<TSchema extends DeesseDatabaseSchema = never, TCapabilities extends object = DeesseDatabaseCapabilities> =
  DeesseDatabaseAdapter<TSchema, TCapabilities>
export type CapabilitiesOf<TAdapter extends DeesseDatabaseAdapterContract> = TAdapter["database"]["capabilities"]

export type DeesseBetterAuthOptions = BetterAuthOptions
export type BetterAuthServerInstance = {
  readonly handler: (request: Request) => Promise<Response>
  readonly fetch: (request: Request) => Promise<Response>
  readonly api: object
  readonly options: BetterAuthOptions
  readonly $Infer: { readonly Session: { readonly session: object; readonly user: object } }
}

export type PluginContribution = {
  database?: { schema: DeesseDatabaseSchema }
  auth?: {
    serverPlugins?: readonly BetterAuthPlugin[]
    clientPlugins?: readonly BetterAuthClientPlugin[]
    schema?: BetterAuthPlugin["schema"]
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
} & (TDefinition extends { args: infer TSchema extends ZodType } ? { args: ZodInput<TSchema> } : Record<never, never>)

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
export type PluginAuthSchema<TPlugins extends readonly AnyPlugin[]> = ContributionOf<TPlugins> extends infer TContribution
  ? TContribution extends { auth: { schema: infer TSchema extends object } } ? TSchema : never
  : never
export type DeesseAuthSchema<TPlugins extends readonly AnyPlugin[]> = MergeContributionObjects<PluginAuthSchema<TPlugins>>
export type ComposedBetterAuthOptions<TAuth extends BetterAuthOptions, TPlugins extends readonly AnyPlugin[]> =
  Omit<TAuth, "plugins"> & { plugins: Array<AppAuthPlugin<TAuth> | PluginAuthServerPlugin<TPlugins>> }

export type DeesseApiOptions = { router?: AnyRouter; [key: string]: unknown }

export type DeesseConfig<
  TDatabaseAdapter extends DeesseDatabaseAdapterContract,
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
    readonly schema: DeesseAuthSchema<TPlugins>
  }
  readonly api: PluginRouters<TPlugins>
  readonly extensions: MergeContributionObjects<ExtensionContribution<ContributionOf<TPlugins>>>
}

export type ApiRouter<TApi, TPlugins extends readonly AnyPlugin[]> =
  (TApi extends { router: infer TRouter extends AnyRouter } ? TRouter : Record<never, never>) & PluginRouters<TPlugins>

export type DeesseFetchHandler = (request: Request) => Promise<Response>
export type DeesseRequestUser = { readonly id: string; readonly email: string; readonly [key: string]: unknown }
export type DeesseRequestContext<TSchema extends DeesseDatabaseSchema = never, TCapabilities extends object = DeesseDatabaseCapabilities, TUser = DeesseRequestUser | null, TSession = object | null> = {
  readonly database: DeesseDatabaseService<TSchema, TCapabilities>
  readonly request: Request
  readonly headers: Headers
  readonly user: TUser
  readonly session: TSession
}

export type DeesseInstance<
  TAdapter extends DeesseDatabaseAdapterContract,
  TAuth extends BetterAuthServerInstance,
  TApiRouter,
  TPlugins extends readonly AnyPlugin[] = readonly [],
> = {
  readonly database: DeesseDatabaseService<ComposedDatabaseSchema<TAdapter, TPlugins>, CapabilitiesOf<TAdapter>>
  readonly auth: TAuth
  readonly api: { readonly router: TApiRouter }
  readonly handler: DeesseFetchHandler
}

type AdapterSchema<TAdapter extends DeesseDatabaseAdapterContract> = TAdapter["database"] extends DeesseDatabaseService<infer TSchema, object> ? TSchema : never
type PluginDatabaseSchema<TPlugins extends readonly AnyPlugin[]> = ContributionOf<TPlugins> extends infer TContribution
  ? TContribution extends { database: { schema: infer TSchema extends DeesseDatabaseSchema } } ? TSchema : never
  : never
export type ComposedDatabaseSchema<TAdapter extends DeesseDatabaseAdapterContract, TPlugins extends readonly AnyPlugin[]> =
  MergeContributionObjects<AdapterSchema<TAdapter> | PluginDatabaseSchema<TPlugins>> extends infer TSchema
    ? { [TModel in keyof TSchema]: TSchema[TModel] extends DeesseModelDefinition ? TSchema[TModel] : never }
    : never

export type BetterAuthInstance<TOptions extends BetterAuthOptions> = ReturnType<typeof betterAuth<TOptions>>
export type { AnyRouter, BetterAuthOptions, Result, ZodInput, ZodType }
