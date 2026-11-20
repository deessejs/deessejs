import { betterAuth } from "better-auth"
import { os, type InferRouterInputs, type InferRouterOutputs, type RouterClient } from "@orpc/server"
import { username } from "better-auth/plugins"
import { usernameClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, createPluginApi, plugin, type ApiRouter, type BetterAuthInstance, type CapabilitiesOf, type ComposedBetterAuthOptions, type ComposedDatabaseSchema, type ConfiguredRegistration, type DatabaseAdapter, type Definition, type DeesseConfig, type DeesseDatabaseSchema, type DeesseDatabaseService, type DeesseInstance, type DeesseRequestUser, type NoArgsRegistration } from "deesse"
import { createClient, type DeesseReactAuthOptions, type DeesseReactRegistry } from "deesse/react"
import { toNextJsHandler } from "deesse/next"

type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false
type Assert<T extends true> = T

const consumerSchema = { posts: { fields: { title: { type: "string" } } } } as const satisfies DeesseDatabaseSchema
declare const database: DatabaseAdapter<typeof consumerSchema>
const auth = { baseURL: "https://consumer.example", plugins: [username()] }
const router = os.router({
  ping: os.input(z.object({ count: z.number() })).output(z.string()).handler(({ input }) => String(input.count)),
})
const feature = plugin({
  id: "feature",
  args: z.object({ prefix: z.string().default("hello") }),
  handler: (args) => {
    const prefix: string = args.prefix
    // @ts-expect-error handlers receive parsed schema output only
    void args.database
    void prefix
    return { api: { router } }
  },
})
const config = {
  database,
  auth,
  api: { router },
  plugins: [feature({})],
} as const satisfies DeesseConfig<typeof database, typeof auth, { router: typeof router }, readonly [ReturnType<typeof feature>]>
const app = createDeesse(config)
const pluginApi = createPluginApi(consumerSchema)
const pluginContextRouter = pluginApi.router({
  user: pluginApi.handler(({ context }) => {
    const user: DeesseRequestUser | null = context.user
    return user?.email ?? null
  }),
})
const nextHandler = toNextJsHandler(app)
type ExpectedAuth = ReturnType<typeof betterAuth<ComposedBetterAuthOptions<typeof auth, typeof config.plugins>>>
type ExpectedRouter = typeof router & { feature: typeof router }
type ExpectedInstance = DeesseInstance<typeof database, ExpectedAuth, ExpectedRouter, typeof config.plugins>
type PublicInstanceExact = Assert<Equal<typeof app, ExpectedInstance>>
type PublicPluginContextExact = Assert<Equal<InferRouterOutputs<typeof pluginContextRouter>["user"], string | null>>
type PublicRouterAliasExact = Assert<Equal<ApiRouter<{ router: typeof router }, typeof config.plugins>, ExpectedRouter>>
type PublicAuthAliasExact = Assert<Equal<BetterAuthInstance<ComposedBetterAuthOptions<typeof auth, typeof config.plugins>>, ExpectedAuth>>
type PublicCapabilitiesExact = Assert<Equal<typeof app.database, DeesseDatabaseService<ComposedDatabaseSchema<typeof database, typeof config.plugins>, CapabilitiesOf<typeof database>>>>
type PublicInputExact = Assert<Equal<InferRouterInputs<typeof app.api.router>["ping"], { count: number }>>
type PublicOutputExact = Assert<Equal<InferRouterOutputs<typeof app.api.router>["feature"]["ping"], string>>
const registered = feature({ prefix: "hi" })
type PublicDefinitionAssignable = Assert<typeof feature.definition extends Definition<typeof feature.definition.args, { api: { router: typeof router } }, readonly [], Readonly<Record<never, never>>> ? true : false>
type PublicConfiguredRegistrationExact = Assert<Equal<typeof registered, ConfiguredRegistration<typeof feature.definition>>>
const parsedPrefix: string = registered.args.prefix
// @ts-expect-error raw args accept the optional string field, not another type
feature({ prefix: 1 })
const noArgsFeature = plugin({ id: "noargs", handler: () => ({ api: { router } }) })
const noArgsRegistration = noArgsFeature()
type PublicNoArgsRegistrationExact = Assert<Equal<typeof noArgsRegistration, NoArgsRegistration<typeof noArgsFeature.definition>>>

const authClientPlugin = usernameClient()
declare module "deesse/react" {
  interface DeesseReactRegistry {
    consumerApp: { router: typeof app.api.router; authOptions: { plugins: [typeof authClientPlugin] } }
  }
}
const client = createClient()
type PublicRouterClientExact = Assert<Equal<typeof client.api, RouterClient<typeof app.api.router>>>
type PublicReactRegistryExact = Assert<Equal<DeesseReactAuthOptions, DeesseReactRegistry["consumerApp"]["authOptions"]>>
const apiResult: Promise<string> = client.api.feature.ping({ count: 3 })
const usernameResult = client.auth.isUsernameAvailable({ username: "ada" })
const usernameAvailable: boolean | undefined = (await usernameResult).data?.available
void [parsedPrefix, apiResult, usernameAvailable, nextHandler]
void (null as unknown as [PublicInstanceExact, PublicPluginContextExact, PublicRouterAliasExact, PublicAuthAliasExact, PublicCapabilitiesExact, PublicInputExact, PublicOutputExact, PublicRouterClientExact, PublicReactRegistryExact, PublicDefinitionAssignable, PublicConfiguredRegistrationExact, PublicNoArgsRegistrationExact])
