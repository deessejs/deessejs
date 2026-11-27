import { betterAuth, type BetterAuthOptions } from "better-auth"
import { createAuthClient, type ReactAuthClient } from "better-auth/react"
import { os, type InferRouterInputs, type InferRouterOutputs, type RouterClient } from "@orpc/server"
import { organization, username } from "better-auth/plugins"
import { inferAdditionalFields, organizationClient, usernameClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, createPluginApi, plugin, type CapabilitiesOf, type ComposedBetterAuthOptions, type ComposedDatabaseSchema, type DatabaseAdapter, type DeesseAuthAdapter, type DeesseConfig, type DeesseDatabaseAdapter, type DeesseDatabaseResult, type DeesseDatabaseSchema, type DeesseDatabaseService, type DeesseFieldDefinition, type DeesseInstance, type DeesseJsonValue, type DeesseModelResult, type DeesseModelRow, type DeessePluginContributionRegistry, type DeesseRequestContext, type PluginExtension } from "deesse"
import { createClient, deesseServer, type DeesseServer } from "deesse/react"

type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false
type Assert<T extends true> = T

// @ts-expect-error defaults must match the declared field type
const invalidFieldDefault: DeesseFieldDefinition = { type: "string", default: 42 }

const procedures = os.router({
  get: os.input(z.object({ id: z.string() })).output(z.object({ title: z.string() })).handler(({ input }) => ({ title: input.id })),
})
const appRouter = os.router({
  ping: os.input(z.object({ count: z.number() })).output(z.string()).handler(({ input }) => String(input.count)),
})
const feature = plugin({
  id: "feature",
  args: z.object({ count: z.number().default(3) }),
  extensionPoints: {
    dashboardWidget: z.object({ title: z.string(), href: z.string() }),
    dashboardMetric: z.object({ label: z.string() }),
  },
  handler: (args) => {
    const count: number = args.count
    // @ts-expect-error plugin handlers receive only parsed args
    void args.database
    return { api: { router: procedures }, count }
  },
})
const contributedUsernameServer = username()
const contributedUsernameClient = usernameClient()
const usernameFeature = plugin({
  id: "username",
  args: z.object({ prefix: z.string().default("user") }),
  requires: ["feature"] as const,
  handler: (args) => ({
    database: { schema: { usernames: { fields: { value: { type: "string" } } } } as const satisfies DeesseDatabaseSchema },
    auth: { serverPlugins: [contributedUsernameServer] as const, clientPlugins: [contributedUsernameClient] as const, schema: contributedUsernameServer.schema },
    api: { router: appRouter },
    extensions: { feature: { dashboardWidget: { title: args.prefix, href: "/users" } satisfies PluginExtension<typeof feature, "dashboardWidget"> } },
  }),
})
const auditFeature = plugin({
  id: "audit",
  args: z.object({}),
  requires: ["feature"] as const,
  handler: () => ({
    database: { schema: { auditEvents: { fields: { action: { type: "string" } } } } as const satisfies DeesseDatabaseSchema },
    extensions: { feature: { dashboardMetric: { label: "Audit events" } satisfies PluginExtension<typeof feature, "dashboardMetric"> } },
  }),
})
const noConfigPlugin = plugin({
  id: "no-config",
  requires: ["feature"] as const,
  extensionPoints: { card: z.object({ title: z.string() }) },
  handler: () => ({
    api: { router: procedures },
    database: { schema: { noConfig: { fields: { enabled: { type: "boolean" } } } } as const satisfies DeesseDatabaseSchema },
  }),
})
const adapterSchema = {
  article: { fields: { title: { type: "string" }, status: { type: "string" }, summary: { type: "text", nullable: true }, publishedAt: { type: "timestamp", default: "2024-01-01T00:00:00.000Z" }, views: { type: "integer", default: 0 }, metadata: { type: "json", nullable: true } } },
} as const satisfies DeesseDatabaseSchema
declare const database: DatabaseAdapter<typeof adapterSchema>
const auth = {
  baseURL: "https://example.test",
  plugins: [organization()],
  user: { additionalFields: { teamCode: { type: "string", required: true } } },
} satisfies BetterAuthOptions
const orgClient = organizationClient()
const minimalApp = createDeesse({ database, auth })
const contextualOs = os.$context<DeesseRequestContext<typeof adapterSchema>>()
const inferredPluginOs = createPluginApi(adapterSchema)
const inferredPluginRouter = inferredPluginOs.router({
  articleContext: inferredPluginOs.handler(({ context }) => {
    const service: DeesseDatabaseService<typeof adapterSchema> = context.database
    const email: string | undefined = context.user?.email
    return { email, service: service.capabilities.transactions }
  }),
})
const contextualRouter = contextualOs.router({
  articleById: contextualOs.handler(({ context }) => {
    const service: DeesseDatabaseService<typeof adapterSchema> = context.database
    const request: Request = context.request
    const contextContract: DeesseRequestContext<typeof adapterSchema> = context
    void [request, contextContract]
    return service.findById("article", "article-1")
  }),
})
const contextualApp = createDeesse({ database, auth, api: { router: contextualRouter } })
const configuredOutputPlugin = plugin({
  id: "configured-output",
  args: z.object({ amount: z.string().transform(Number) }),
  handler: ({ amount }) => ({ amount, label: amount.toFixed(2) }),
})
const configuredOutputApp = createDeesse({
  database,
  auth,
  plugins: [configuredOutputPlugin({ amount: "12" })],
})
const configuredOutputAmount: number | undefined = configuredOutputApp.plugins.get("configured-output")?.amount
const configuredOutput = configuredOutputApp.plugins.get("configured-output")
for (const [configuredOutputId, configuredOutputValue] of configuredOutputApp.plugins.entries()) {
  const exactConfiguredOutputId: "configured-output" = configuredOutputId
  const exactConfiguredOutputAmount: number = configuredOutputValue.amount
  void [exactConfiguredOutputId, exactConfiguredOutputAmount]
}
let invalidConfiguredOutputAmount = ""
if (configuredOutput) {
  // @ts-expect-error the runtime exposes the plugin output object as readonly
  configuredOutput.amount = 13
  // @ts-expect-error the accessor returns the processed numeric output, not the input string
  invalidConfiguredOutputAmount = configuredOutput.amount
}
const noConfigRegistration = noConfigPlugin()
const config = { database, auth, api: { router: appRouter }, plugins: [feature({}), usernameFeature({}), auditFeature({})] } as const satisfies DeesseConfig<typeof database, typeof auth, { router: typeof appRouter }, readonly [ReturnType<typeof feature>, ReturnType<typeof usernameFeature>, ReturnType<typeof auditFeature>]>
const app = createDeesse(config)
const additionalFieldsClient = inferAdditionalFields<typeof app.auth>()
const directApp = createDeesse({ database, auth, api: { router: appRouter }, plugins: [feature({}), usernameFeature({}), auditFeature({})] })
type ExpectedAuthOptions = ComposedBetterAuthOptions<typeof auth, typeof config.plugins>
type ExpectedAuthInstance = ReturnType<typeof betterAuth<ExpectedAuthOptions>>
type ExpectedRouter = typeof appRouter & { feature: typeof procedures; username: typeof appRouter }
type ExpectedDeesseInstance = DeesseInstance<typeof database, ExpectedAuthInstance, ExpectedRouter, typeof config.plugins>
type PluginContributions = DeessePluginContributionRegistry<typeof config.plugins>
type ConfigDatabaseExact = Assert<Equal<typeof config.database, typeof database>>
type ConfigAuthExact = Assert<Equal<typeof config.auth, typeof auth>>
type ConfigApiExact = Assert<Equal<typeof config.api.router, typeof appRouter>>
type ConfigPluginsExact = Assert<Equal<typeof config.plugins, readonly [ReturnType<typeof feature>, ReturnType<typeof usernameFeature>, ReturnType<typeof auditFeature>]>>
type DatabaseExact = Assert<Equal<typeof app.database, DeesseDatabaseService<ComposedDatabaseSchema<typeof database, typeof config.plugins>, CapabilitiesOf<typeof database>>>>
type AuthExact = Assert<Equal<typeof app.auth, ExpectedAuthInstance>>
type RouterExact = Assert<Equal<typeof app.api.router, ExpectedRouter>>
type InstanceExact = Assert<Equal<typeof app, ExpectedDeesseInstance>>
type DirectRouterExact = Assert<Equal<typeof directApp.api.router, ExpectedRouter>>
type DirectAuthExact = Assert<Equal<typeof directApp.auth, ExpectedAuthInstance>>
type ComposedDatabaseKeysExact = Assert<Equal<keyof ComposedDatabaseSchema<typeof database, typeof config.plugins>, "article" | "usernames" | "auditEvents">>
type InstanceDatabaseSchema = typeof app.database extends DeesseDatabaseService<infer TSchema, object> ? TSchema : never
type ComposedInstanceDatabaseKeysExact = Assert<Equal<keyof InstanceDatabaseSchema, "article" | "usernames" | "auditEvents">>
type AuthAdapterExact = Assert<Equal<typeof database.authAdapter, DeesseAuthAdapter>>
type DatabaseAdapterShapeExact = Assert<Equal<keyof DeesseDatabaseAdapter<typeof adapterSchema>, "database" | "authAdapter" | "initializeSchema">>
type ContextDatabaseExact = Assert<Equal<DeesseRequestContext<typeof adapterSchema>["database"], DeesseDatabaseService<typeof adapterSchema>>>
type InferredPluginRouterOutputExact = Assert<Equal<InferRouterOutputs<typeof inferredPluginRouter>["articleContext"], { email: string | undefined; service: true }>>
type ContextualRouterKeysExact = Assert<Equal<keyof typeof contextualApp.api.router, "articleById">>
type ConfiguredPluginOutputExact = Assert<Equal<NonNullable<typeof configuredOutput>["amount"], number>>
type NoConfigArgsOmitted = Assert<Equal<keyof typeof noConfigRegistration, "id" | "definition">>
type NoConfigContributionExact = Assert<Equal<keyof ReturnType<typeof noConfigRegistration.definition.handler>["database"]["schema"], "noConfig">>
type NoConfigRequiresExact = Assert<Equal<typeof noConfigRegistration.definition.requires, readonly ["feature"]>>
type NoConfigExtensionKeysExact = Assert<Equal<keyof typeof noConfigRegistration.definition.extensionPoints, "card">>
type HandlerExact = Assert<Equal<typeof app.handler, (request: Request) => Promise<Response>>>
type PluginTupleExact = Assert<Equal<typeof config.plugins, readonly [ReturnType<typeof feature>, ReturnType<typeof usernameFeature>, ReturnType<typeof auditFeature>]>>
type PluginRouterRegistryKeysExact = Assert<Equal<keyof PluginContributions["api"], "feature" | "username">>
type PluginDatabaseRegistryKeysExact = Assert<Equal<keyof PluginContributions["database"], "usernames" | "auditEvents">>
type PluginExtensionRegistryKeysExact = Assert<Equal<keyof PluginContributions["extensions"]["feature"], "dashboardWidget" | "dashboardMetric">>
type RegistryUsernameSchemaExact = Assert<Equal<PluginContributions["database"]["usernames"], typeof usernameContribution.database.schema.usernames>>
type RegistryAuditSchemaExact = Assert<Equal<PluginContributions["database"]["auditEvents"], typeof auditContribution.database.schema.auditEvents>>
type RegistryWidgetExact = Assert<Equal<PluginContributions["extensions"]["feature"]["dashboardWidget"], typeof usernameContribution.extensions.feature.dashboardWidget>>
type RegistryMetricExact = Assert<Equal<PluginContributions["extensions"]["feature"]["dashboardMetric"], typeof auditContribution.extensions.feature.dashboardMetric>>
type PluginServerRegistryExact = Assert<Equal<PluginContributions["auth"]["serverPlugins"][number], typeof contributedUsernameServer>>
type PluginClientRegistryExact = Assert<Equal<PluginContributions["auth"]["clientPlugins"][number], typeof contributedUsernameClient>>
type PluginAuthSchemaExact = Assert<Equal<PluginContributions["auth"]["schema"], typeof contributedUsernameServer.schema>>
type ArticleIdExact = Assert<Equal<DeesseModelRow<typeof adapterSchema.article>["id"], string>>
type ArticleSummaryExact = Assert<Equal<DeesseModelRow<typeof adapterSchema.article>["summary"], string | null>>
type ArticlePublishedAtExact = Assert<Equal<DeesseModelRow<typeof adapterSchema.article>["publishedAt"], Date>>
type ArticleJsonExact = Assert<Equal<DeesseModelRow<typeof adapterSchema.article>["metadata"], DeesseJsonValue | null>>
type RequestContextDatabaseExact = Assert<Equal<DeesseRequestContext<typeof adapterSchema>["database"], DeesseDatabaseService<typeof adapterSchema>>>
type ApiInputExact = Assert<Equal<InferRouterInputs<typeof app.api.router>["ping"], { count: number }>>
type ApiOutputExact = Assert<Equal<InferRouterOutputs<typeof app.api.router>["feature"]["get"], { title: string }>>
type EmptyRouterExact = Assert<Equal<keyof typeof minimalApp.api.router, never>>
void app.auth.api.createOrganization
const registration = feature({})
type RegistrationArgsExact = Assert<Equal<typeof registration.args, Parameters<typeof feature>[0]>>
type RawArgsExact = Assert<Equal<Parameters<typeof feature>[0], { count?: number | undefined }>>
type ParsedHandlerArgsExact = Assert<Equal<Parameters<typeof feature.definition.handler>[0], { count: number }>>
type HandlerContributionExact = Assert<Equal<ReturnType<typeof registration.definition.handler>, { api: { router: typeof procedures }; count: number }>>
type RequiresExact = Assert<Equal<NonNullable<typeof usernameFeature.definition.requires>, readonly ["feature"]>>
type AuditRequiresExact = Assert<Equal<NonNullable<typeof auditFeature.definition.requires>, readonly ["feature"]>>
const usernameContribution = usernameFeature.definition.handler({ prefix: "member" })
const auditContribution = auditFeature.definition.handler({})
type UsernameSchemaKeysExact = Assert<Equal<keyof typeof usernameContribution.database.schema, "usernames">>
type UsernameFieldTypeExact = Assert<Equal<typeof usernameContribution.database.schema.usernames.fields.value.type, "string">>
type UsernameApiContributionExact = Assert<Equal<typeof usernameContribution.api.router, typeof appRouter>>
type UsernameServerPluginExact = Assert<Equal<typeof usernameContribution.auth.serverPlugins, readonly [typeof contributedUsernameServer]>>
type UsernameClientPluginExact = Assert<Equal<typeof usernameContribution.auth.clientPlugins, readonly [typeof contributedUsernameClient]>>
type ExtensionContributionExact = Assert<Equal<typeof usernameContribution.extensions.feature.dashboardWidget, { title: string; href: string }>>
// @ts-expect-error the provider's extension point requires a string label
const incompatibleDashboardMetric: PluginExtension<typeof feature, "dashboardMetric"> = { label: 42 }
const parsedCount: number = feature.definition.handler({ count: 3 }).count
// @ts-expect-error raw plugin args reject non-number counts
feature({ count: "wrong" })
// @ts-expect-error the registration retains raw args, so defaulted fields may be omitted
const missing: number = registration.args.count
const portableTransactions: true = app.database.capabilities.transactions
const articleResult = app.database.findById("article", "article-id")
const usernameResult = app.database.findById("usernames", "user-1")
const auditEvents = app.database.findMany("auditEvents", { where: { action: { in: ["create", "delete"] } }, limit: 10 })
const articlePage = app.database.findMany("article", { where: { status: { in: ["draft", "published"] }, summary: null }, orderBy: { publishedAt: "desc" }, limit: 25, offset: 50 })
const insertedArticle = app.database.insert("article", { title: "Typed", status: "draft" })
const updatedArticle = app.database.updateById("article", "article-id", { views: 4 })
const deletedArticle = app.database.deleteById("article", "article-id")
const transactionResult = app.database.transaction(async (transaction) => transaction.insert("article", { title: "Inside transaction", status: "draft" }))
type ArticleDatabaseResult = DeesseModelResult<"article", DeesseModelRow<typeof adapterSchema.article>>
type ArticleRowResult = DeesseDatabaseResult<DeesseModelRow<typeof adapterSchema.article>>
type ArticleResultExact = Assert<Equal<typeof articleResult, Promise<ArticleDatabaseResult>>>
type ArticleNotFoundFieldsExact = Assert<Equal<Extract<Extract<ArticleDatabaseResult, { _tag: "Err" }>["error"]["fields"], { code: "NOT_FOUND" }>, { code: "NOT_FOUND"; message: string; model: string; id: string }>>
type ArticleInsertExact = Assert<Equal<typeof insertedArticle, Promise<ArticleRowResult>>>
type ArticleUpdateExact = Assert<Equal<typeof updatedArticle, Promise<ArticleDatabaseResult>>>
type ArticleDeleteExact = Assert<Equal<typeof deletedArticle, Promise<ArticleDatabaseResult>>>
type UsernameModelRowKeysExact = Assert<Equal<keyof DeesseModelRow<InstanceDatabaseSchema["usernames"]>, "id" | "value">>
type UsernameModelRowFieldsExact = Assert<Equal<DeesseModelRow<InstanceDatabaseSchema["usernames"]>["id" | "value"], string>>
type AuditModelRowKeysExact = Assert<Equal<keyof DeesseModelRow<InstanceDatabaseSchema["auditEvents"]>, "id" | "action">>
type AuditModelRowFieldsExact = Assert<Equal<DeesseModelRow<InstanceDatabaseSchema["auditEvents"]>["id" | "action"], string>>
type UsernameRowExact = Assert<Equal<typeof usernameResult, Promise<DeesseModelResult<"usernames", DeesseModelRow<InstanceDatabaseSchema["usernames"]>>>>>
type AuditRowsExact = Assert<Equal<typeof auditEvents, Promise<DeesseDatabaseResult<DeesseModelRow<InstanceDatabaseSchema["auditEvents"]>[]>>>>
type ArticlePageExact = Assert<Equal<typeof articlePage, Promise<DeesseDatabaseResult<DeesseModelRow<typeof adapterSchema.article>[]>>>>
type TransactionResultExact = Assert<Equal<typeof transactionResult, Promise<ArticleRowResult>>>
// @ts-expect-error unknown model names are rejected
app.database.findById("missing", "id")
// @ts-expect-error plugin-contributed models are composed, but unknown models remain invalid
app.database.findById("comment", "id")
// @ts-expect-error unknown model fields are rejected in filters
app.database.findMany("article", { where: { unknownField: "value" }, limit: 10 })
// @ts-expect-error `in` values must match the selected field type
app.database.findMany("article", { where: { status: { in: [1, 2] } }, limit: 10 })
// @ts-expect-error query limits are restricted to 1 through 100
app.database.findMany("article", { limit: 101 })
// @ts-expect-error required fields are required on insert
app.database.insert("article", { status: "draft" })
// @ts-expect-error undeclared fields are rejected on insert
app.database.insert("article", { title: "Typed", status: "draft", unknownField: "value" })
// @ts-expect-error JSON fields reject non-JSON values
app.database.insert("article", { title: "Typed", status: "draft", metadata: new Date() })
// @ts-expect-error updates cannot change the generated id
app.database.updateById("article", "id", { id: "new-id" })
app.database.transaction(async (transaction) => {
  // @ts-expect-error nested transactions are not part of the callback service
  transaction.transaction(async () => undefined)
  return transaction.insert("article", { title: "Typed", status: "draft" })
})
// @ts-expect-error provider adapter internals are not exposed on the instance
void app.database.authAdapter
// @ts-expect-error the portable service does not expose a provider client
void app.database.client
void minimalApp.api.router
// @ts-expect-error empty router exposes no procedure keys
void minimalApp.api.router.missing
// @ts-expect-error a plugin without an API contribution is absent from the composed router
void app.api.router.audit
// @ts-expect-error no-args plugin factories reject registration arguments
noConfigPlugin({})

const clientOptions = {
  server: deesseServer<typeof app>(),
  auth: { plugins: [orgClient, contributedUsernameClient, additionalFieldsClient] },
}
const client = createClient(clientOptions)
const linkedClient = createClient({ server: deesseServer<typeof app>() })
const minimalClient = createClient({ server: deesseServer<typeof minimalApp>() })
const builtInAuthReference = createAuthClient()
const isolatedAuthClient = createAuthClient({ plugins: [orgClient, contributedUsernameClient, additionalFieldsClient] })
const isolatedUsernameClient = createAuthClient({ plugins: [usernameClient()] })
const isolatedContributedUsernameClient = createAuthClient({ plugins: [contributedUsernameClient] })
void isolatedUsernameClient.isUsernameAvailable
void isolatedContributedUsernameClient.isUsernameAvailable
void isolatedAuthClient.isUsernameAvailable
const isolatedTeamCode: string = isolatedAuthClient.$Infer.Session.user.teamCode
type ClientApiExact = Assert<Equal<typeof client.api, RouterClient<typeof app.api.router>>>
type LinkedClientApiExact = Assert<Equal<typeof linkedClient.api, RouterClient<typeof app.api.router>>>
type MinimalClientApiExact = Assert<Equal<typeof minimalClient.api, RouterClient<typeof minimalApp.api.router>>>
type ClientAuthExact = Assert<Equal<typeof client.auth, ReactAuthClient<typeof clientOptions.auth>>>
type BuiltInAuthExact = Assert<Equal<typeof minimalClient.auth, typeof builtInAuthReference>>
type DeesseServerKeysExact = Assert<Equal<keyof DeesseServer<typeof app>, "api">>
type DeesseServerRouterExact = Assert<Equal<DeesseServer<typeof app>["api"]["router"], typeof app.api.router>>
const minimalSessionUserId: string = minimalClient.auth.$Infer.Session.user.id
// @ts-expect-error the linked empty application router has no client procedures
void minimalClient.api.missing
void app.auth.api.isUsernameAvailable
const serverTeamCode: string = app.auth.$Infer.Session.user.teamCode
const pluginResult: Promise<{ title: string }> = client.api.feature.get({ id: "article-1" })
const appResult: Promise<string> = client.api.ping({ count: 4 })
// @ts-expect-error procedure input must match the router schema
client.api.feature.get({ id: 123 })
// @ts-expect-error application procedure input must match its schema
client.api.ping({ count: "four" })
// @ts-expect-error procedure output is not an arbitrary type
const wrongOutput: Promise<number> = client.api.feature.get({ id: "article-1" })
// @ts-expect-error unknown router keys are rejected
void client.api.feature.missing
// @ts-expect-error a plugin without an API contribution has no client namespace
void client.api.audit
type UsernameClientInput = Omit<Parameters<typeof client.auth.isUsernameAvailable>[0], "fetchOptions">
type UsernameClientInputExact = Assert<Equal<UsernameClientInput, Omit<Parameters<typeof isolatedAuthClient.isUsernameAvailable>[0], "fetchOptions">>>
const usernameArgs: Parameters<typeof client.auth.isUsernameAvailable>[0] = { username: "ada" }
// @ts-expect-error username client endpoint requires its typed username input
client.auth.isUsernameAvailable({ username: 42 })
const usernameAvailable = client.auth.isUsernameAvailable(usernameArgs)
const usernameResponse = await usernameAvailable
const availability: boolean | undefined = usernameResponse.data?.available
const clientTeamCode: string = client.auth.$Infer.Session.user.teamCode
const clientUsername: ReturnType<typeof client.auth.useSession> = client.auth.useSession()
const organizationPermission: boolean = client.auth.organization.checkRolePermission({ permissions: { organization: ["update"] }, role: "member" })
// @ts-expect-error the organization client rejects roles outside the configured plugin
client.auth.organization.checkRolePermission({ permissions: { organization: ["update"] }, role: "unknown" })
void [parsedCount, missing, invalidFieldDefault, portableTransactions, insertedArticle, updatedArticle, deletedArticle, pluginResult, appResult, wrongOutput, serverTeamCode, usernameAvailable, availability, clientTeamCode, clientUsername, isolatedTeamCode, minimalSessionUserId, organizationPermission, incompatibleDashboardMetric]
void (null as unknown as [ConfigDatabaseExact, ConfigAuthExact, ConfigApiExact, ConfigPluginsExact, DatabaseExact, AuthExact, RouterExact, InstanceExact, DirectRouterExact, DirectAuthExact, ComposedDatabaseKeysExact, ComposedInstanceDatabaseKeysExact, AuthAdapterExact, DatabaseAdapterShapeExact, ContextDatabaseExact, InferredPluginRouterOutputExact, ContextualRouterKeysExact, NoConfigArgsOmitted, NoConfigContributionExact, NoConfigRequiresExact, NoConfigExtensionKeysExact, HandlerExact, PluginTupleExact, PluginRouterRegistryKeysExact, PluginDatabaseRegistryKeysExact, PluginExtensionRegistryKeysExact, RegistryUsernameSchemaExact, RegistryAuditSchemaExact, RegistryWidgetExact, RegistryMetricExact, PluginServerRegistryExact, PluginClientRegistryExact, PluginAuthSchemaExact, ArticleIdExact, ArticleSummaryExact, ArticlePublishedAtExact, ArticleJsonExact, RequestContextDatabaseExact, ArticleResultExact, ArticleNotFoundFieldsExact, ArticleInsertExact, ArticleUpdateExact, ArticleDeleteExact, UsernameModelRowKeysExact, UsernameModelRowFieldsExact, AuditModelRowKeysExact, AuditModelRowFieldsExact, UsernameRowExact, AuditRowsExact, ArticlePageExact, TransactionResultExact, ApiInputExact, ApiOutputExact, ClientApiExact, LinkedClientApiExact, MinimalClientApiExact, ClientAuthExact, BuiltInAuthExact, DeesseServerKeysExact, DeesseServerRouterExact, EmptyRouterExact, RegistrationArgsExact, RawArgsExact, ParsedHandlerArgsExact, HandlerContributionExact, RequiresExact, AuditRequiresExact, UsernameSchemaKeysExact, UsernameFieldTypeExact, UsernameApiContributionExact, UsernameServerPluginExact, UsernameClientPluginExact, ExtensionContributionExact, UsernameClientInputExact])
void [configuredOutput, configuredOutputAmount, invalidConfiguredOutputAmount]
void (null as unknown as ConfiguredPluginOutputExact)
