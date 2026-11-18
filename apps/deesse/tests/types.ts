import { betterAuth, type BetterAuthOptions } from "better-auth"
import { os, type InferRouterInputs, type InferRouterOutputs, type RouterClient } from "@orpc/server"
import { organization } from "better-auth/plugins"
import { organizationClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, plugin, type DeesseConfig, type DeesseInstance } from "deesse"
import { createClient } from "deesse/react"

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
  handler: (args) => {
    const count: number = args.count
    // @ts-expect-error plugin handlers receive only parsed args
    void args.database
    return { api: { router: procedures }, count }
  },
})
const database = { database: { capabilities: { transactions: true as const } }, authAdapter: { adapter: true } }
const auth = { baseURL: "https://example.test", plugins: [organization()] } satisfies BetterAuthOptions
const orgClient = organizationClient()
const minimalApp = createDeesse({ database, auth })
const config = { database, auth, api: { router: appRouter }, plugins: [feature({})] } as const satisfies DeesseConfig<typeof database, typeof auth, { router: typeof appRouter }, readonly [ReturnType<typeof feature>]>
const app = createDeesse(config)
type ConfigDatabaseExact = Assert<Equal<typeof config.database, typeof database>>
type ConfigAuthExact = Assert<Equal<typeof config.auth, typeof auth>>
type ConfigApiExact = Assert<Equal<typeof config.api, { readonly router: typeof appRouter }>>
type ConfigPluginsExact = Assert<Equal<typeof config.plugins, readonly [ReturnType<typeof feature>]>>
type DatabaseExact = Assert<Equal<typeof app.database, typeof database.database>>
type AuthExact = Assert<Equal<typeof app.auth, ReturnType<typeof betterAuth<typeof auth>>>>
type RouterExact = Assert<Equal<typeof app.api.router, typeof appRouter & { feature: typeof procedures }>>
type InstanceExact = Assert<Equal<typeof app, DeesseInstance<typeof database.database, ReturnType<typeof betterAuth<typeof auth>>, typeof appRouter & { feature: typeof procedures }>>>
type HandlerExact = Assert<Equal<typeof app.handler, (request: Request) => Promise<Response>>>
type PluginTupleExact = Assert<Equal<typeof config.plugins, readonly [ReturnType<typeof feature>]>>
type ApiInputExact = Assert<Equal<InferRouterInputs<typeof app.api.router>["ping"], { count: number }>>
type ApiOutputExact = Assert<Equal<InferRouterOutputs<typeof app.api.router>["feature"]["get"], { title: string }>>
type ClientApiExact = Assert<Equal<typeof client.api, RouterClient<typeof app.api.router>>>
type EmptyRouterExact = Assert<Equal<keyof typeof minimalApp.api.router, never>>
void app.auth.api.createOrganization
const registration = feature({})
type ParsedArgsExact = Assert<Equal<typeof registration.args, { count: number }>>
type RawArgsExact = Assert<Equal<Parameters<typeof feature>[0], { count?: number | undefined }>>
type HandlerContributionExact = Assert<Equal<ReturnType<typeof registration.definition.handler>, { api: { router: typeof procedures }; count: number }>>
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

declare module "deesse/react" {
  interface DeesseReactRegistry {
    app: { router: typeof app.api.router; authOptions: { plugins: [typeof orgClient] } }
  }
}

const client = createClient()
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
void client.auth.organization
void [count, missing, portableTransactions, pluginResult, appResult, wrongOutput]
void (null as unknown as [ConfigDatabaseExact, ConfigAuthExact, ConfigApiExact, ConfigPluginsExact, DatabaseExact, AuthExact, RouterExact, InstanceExact, HandlerExact, PluginTupleExact, ApiInputExact, ApiOutputExact, ClientApiExact, EmptyRouterExact, ParsedArgsExact, RawArgsExact, HandlerContributionExact])
