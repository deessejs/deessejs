import { betterAuth, type BetterAuthOptions } from "better-auth"
import { createAuthClient } from "better-auth/react"
import type { BetterAuthClientOptions } from "better-auth/client"
import { os, type InferRouterInputs, type InferRouterOutputs, type RouterClient } from "@orpc/server"
import { organization, username } from "better-auth/plugins"
import { inferAdditionalFields, organizationClient, usernameClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, plugin, type CapabilitiesOf, type ComposedBetterAuthOptions, type DeesseConfig, type DeesseDatabaseService, type DeesseInstance, type DeessePluginContributionRegistry, type PluginExtension } from "deesse"
import { createClient, type DeesseReactAuthOptions, type DeesseReactRegistry } from "deesse/react"

type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false
type Assert<T extends true> = T

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
    database: { schema: { usernames: { fields: { value: { type: "string" } } } } },
    auth: { serverPlugins: [contributedUsernameServer] as const, clientPlugins: [contributedUsernameClient] as const },
    api: { router: appRouter },
    extensions: { feature: { dashboardWidget: { title: args.prefix, href: "/users" } satisfies PluginExtension<typeof feature, "dashboardWidget"> } },
  }),
})
const auditFeature = plugin({
  id: "audit",
  args: z.object({}),
  requires: ["feature"] as const,
  handler: () => ({
    database: { schema: { auditEvents: { fields: { action: { type: "string" } } } } },
    extensions: { feature: { dashboardMetric: { label: "Audit events" } satisfies PluginExtension<typeof feature, "dashboardMetric"> } },
  }),
})
const noConfigPlugin = plugin({ id: "no-config", handler: () => ({}) })
const database = { database: { capabilities: { transactions: true as const } }, authAdapter: { adapter: true } }
const auth = {
  baseURL: "https://example.test",
  plugins: [organization()],
  user: { additionalFields: { teamCode: { type: "string", required: true } } },
} satisfies BetterAuthOptions
const orgClient = organizationClient()
const additionalFieldsClient = inferAdditionalFields<typeof auth>()
const minimalApp = createDeesse({ database, auth })
const noConfigRegistration = noConfigPlugin()
const config = { database, auth, api: { router: appRouter }, plugins: [feature({}), usernameFeature({}), auditFeature({})] } as const satisfies DeesseConfig<typeof database, typeof auth, { router: typeof appRouter }, readonly [ReturnType<typeof feature>, ReturnType<typeof usernameFeature>, ReturnType<typeof auditFeature>]>
const app = createDeesse(config)
const directApp = createDeesse({ database, auth, api: { router: appRouter }, plugins: [feature({}), usernameFeature({}), auditFeature({})] })
type ExpectedAuthOptions = ComposedBetterAuthOptions<typeof auth, typeof config.plugins>
type ExpectedAuthInstance = ReturnType<typeof betterAuth<ExpectedAuthOptions>>
type ExpectedRouter = typeof appRouter & { feature: typeof procedures; username: typeof appRouter }
type ExpectedDeesseInstance = DeesseInstance<typeof database, ExpectedAuthInstance, ExpectedRouter>
type PluginContributions = DeessePluginContributionRegistry<typeof config.plugins>
type ConfigDatabaseExact = Assert<Equal<typeof config.database, typeof database>>
type ConfigAuthExact = Assert<Equal<typeof config.auth, typeof auth>>
type ConfigApiExact = Assert<Equal<typeof config.api.router, typeof appRouter>>
type ConfigPluginsExact = Assert<Equal<typeof config.plugins, readonly [ReturnType<typeof feature>, ReturnType<typeof usernameFeature>, ReturnType<typeof auditFeature>]>>
type DatabaseExact = Assert<Equal<typeof app.database, DeesseDatabaseService<CapabilitiesOf<typeof database>>>>
type AuthExact = Assert<Equal<typeof app.auth, ExpectedAuthInstance>>
type RouterExact = Assert<Equal<typeof app.api.router, ExpectedRouter>>
type InstanceExact = Assert<Equal<typeof app, ExpectedDeesseInstance>>
type DirectRouterExact = Assert<Equal<typeof directApp.api.router, ExpectedRouter>>
type DirectAuthExact = Assert<Equal<typeof directApp.auth, ExpectedAuthInstance>>
type NoConfigArgsOmitted = Assert<Equal<keyof typeof noConfigRegistration, "id" | "definition">>
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
type ApiInputExact = Assert<Equal<InferRouterInputs<typeof app.api.router>["ping"], { count: number }>>
type ApiOutputExact = Assert<Equal<InferRouterOutputs<typeof app.api.router>["feature"]["get"], { title: string }>>
type ClientApiExact = Assert<Equal<typeof client.api, RouterClient<typeof app.api.router>>>
type EmptyRouterExact = Assert<Equal<keyof typeof minimalApp.api.router, never>>
void app.auth.api.createOrganization
const registration = feature({})
type ParsedArgsExact = Assert<Equal<typeof registration.args, { count: number }>>
type RawArgsExact = Assert<Equal<Parameters<typeof feature>[0], { count?: number | undefined }>>
type HandlerContributionExact = Assert<Equal<ReturnType<typeof registration.definition.handler>, { api: { router: typeof procedures }; count: number }>>
type RequiresExact = Assert<Equal<NonNullable<typeof usernameFeature.definition.requires>, readonly ["feature"]>>
type AuditRequiresExact = Assert<Equal<NonNullable<typeof auditFeature.definition.requires>, readonly ["feature"]>>
const usernameContribution = usernameFeature.definition.handler({ prefix: "member" })
const auditContribution = auditFeature.definition.handler({})
type ExpectedUsernameDatabase = {
  schema: {
    usernames: {
      fields: {
        value: { type: string }
      }
    }
  }
}
type UsernameDatabaseExact = Assert<Equal<typeof usernameContribution.database, ExpectedUsernameDatabase>>
type UsernameApiContributionExact = Assert<Equal<typeof usernameContribution.api.router, typeof appRouter>>
type UsernameServerPluginExact = Assert<Equal<typeof usernameContribution.auth.serverPlugins, readonly [typeof contributedUsernameServer]>>
type UsernameClientPluginExact = Assert<Equal<typeof usernameContribution.auth.clientPlugins, readonly [typeof contributedUsernameClient]>>
type ExtensionContributionExact = Assert<Equal<typeof usernameContribution.extensions.feature.dashboardWidget, { title: string; href: string }>>
// @ts-expect-error the provider's extension point requires a string label
const incompatibleDashboardMetric: PluginExtension<typeof feature, "dashboardMetric"> = { label: 42 }
const count: number = registration.args.count
// @ts-expect-error raw plugin args reject non-number counts
feature({ count: "wrong" })
// @ts-expect-error schema defaults are present in parsed output
const missing: undefined = registration.args.count
const portableTransactions: true = app.database.capabilities.transactions
// @ts-expect-error provider adapter internals are not exposed on the instance
void app.database.authAdapter
void minimalApp.api.router
// @ts-expect-error empty router exposes no procedure keys
void minimalApp.api.router.missing
// @ts-expect-error a plugin without an API contribution is absent from the composed router
void app.api.router.audit

declare module "deesse/react" {
  interface DeesseReactRegistry {
    app: { router: typeof app.api.router; authOptions: { plugins: [typeof orgClient, typeof contributedUsernameClient, typeof additionalFieldsClient] } }
  }
}

const client = createClient()
const isolatedAuthClient = createAuthClient({ plugins: [orgClient, contributedUsernameClient, additionalFieldsClient] })
const isolatedUsernameClient = createAuthClient({ plugins: [usernameClient()] })
const isolatedContributedUsernameClient = createAuthClient({ plugins: [contributedUsernameClient] })
void isolatedUsernameClient.isUsernameAvailable
void isolatedContributedUsernameClient.isUsernameAvailable
void isolatedAuthClient.isUsernameAvailable
const isolatedTeamCode: string = isolatedAuthClient.$Infer.Session.user.teamCode
type ReactAuthOptionsBound = Assert<DeesseReactRegistry["app"]["authOptions"] extends BetterAuthClientOptions ? true : false>
type ReactAuthOptionsPluginTypes = Assert<Equal<DeesseReactRegistry["app"]["authOptions"]["plugins"], [typeof orgClient, typeof contributedUsernameClient, typeof additionalFieldsClient]>>
type ReactAuthOptionsExtracted = Assert<Equal<DeesseReactAuthOptions, DeesseReactRegistry["app"]["authOptions"]>>
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
type UsernameClientInputExact = Assert<Equal<UsernameClientInput, { username: string }>>
const usernameArgs: Parameters<typeof client.auth.isUsernameAvailable>[0] = { username: "ada" }
// @ts-expect-error username client endpoint requires its typed username input
client.auth.isUsernameAvailable({ username: 42 })
const usernameAvailable = client.auth.isUsernameAvailable(usernameArgs)
const usernameResponse = await usernameAvailable
const availability: boolean | undefined = usernameResponse.data?.available
const clientTeamCode: string = client.auth.$Infer.Session.user.teamCode
const clientUsername: ReturnType<typeof client.auth.useSession> = client.auth.useSession()
const organizationPermission: boolean = client.auth.organization.checkRolePermission({ permissions: { organization: ["update"] }, role: "admin" })
// @ts-expect-error the organization client rejects roles outside the configured plugin
client.auth.organization.checkRolePermission({ permissions: { organization: ["update"] }, role: "unknown" })
void [count, missing, portableTransactions, pluginResult, appResult, wrongOutput, serverTeamCode, usernameAvailable, availability, clientTeamCode, clientUsername, isolatedTeamCode, organizationPermission, incompatibleDashboardMetric]
void (null as unknown as [ConfigDatabaseExact, ConfigAuthExact, ConfigApiExact, ConfigPluginsExact, DatabaseExact, AuthExact, RouterExact, InstanceExact, DirectRouterExact, DirectAuthExact, NoConfigArgsOmitted, HandlerExact, PluginTupleExact, PluginRouterRegistryKeysExact, PluginDatabaseRegistryKeysExact, PluginExtensionRegistryKeysExact, RegistryUsernameSchemaExact, RegistryAuditSchemaExact, RegistryWidgetExact, RegistryMetricExact, PluginServerRegistryExact, PluginClientRegistryExact, ApiInputExact, ApiOutputExact, ClientApiExact, EmptyRouterExact, ParsedArgsExact, RawArgsExact, HandlerContributionExact, RequiresExact, AuditRequiresExact, UsernameDatabaseExact, UsernameApiContributionExact, UsernameServerPluginExact, UsernameClientPluginExact, ExtensionContributionExact, UsernameClientInputExact, ReactAuthOptionsBound, ReactAuthOptionsPluginTypes, ReactAuthOptionsExtracted])
