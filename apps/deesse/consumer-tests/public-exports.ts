import { betterAuth } from "better-auth"
import { os, type InferRouterInputs, type InferRouterOutputs, type RouterClient } from "@orpc/server"
import { username } from "better-auth/plugins"
import { usernameClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, plugin, type CapabilitiesOf, type ComposedBetterAuthOptions, type DeesseConfig, type DeesseDatabaseService, type DeesseInstance } from "deesse"
import { createClient, type DeesseReactAuthOptions, type DeesseReactRegistry } from "deesse/react"

type Equal<T, U> = (<V>() => V extends T ? 1 : 2) extends (<V>() => V extends U ? 1 : 2) ? true : false
type Assert<T extends true> = T

const database = { database: { capabilities: { transactions: true as const } }, authAdapter: { provider: "consumer-fixture" } }
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
type ExpectedAuth = ReturnType<typeof betterAuth<ComposedBetterAuthOptions<typeof auth, typeof config.plugins>>>
type ExpectedRouter = typeof router & { feature: typeof router }
type ExpectedInstance = DeesseInstance<typeof database, ExpectedAuth, ExpectedRouter>
type PublicInstanceExact = Assert<Equal<typeof app, ExpectedInstance>>
type PublicCapabilitiesExact = Assert<Equal<typeof app.database, DeesseDatabaseService<CapabilitiesOf<typeof database>>>>
type PublicInputExact = Assert<Equal<InferRouterInputs<typeof app.api.router>["ping"], { count: number }>>
type PublicOutputExact = Assert<Equal<InferRouterOutputs<typeof app.api.router>["feature"]["ping"], string>>
const registered = feature({ prefix: "hi" })
const parsedPrefix: string = registered.args.prefix
// @ts-expect-error raw args accept the optional string field, not another type
feature({ prefix: 1 })

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
void [parsedPrefix, apiResult, usernameAvailable]
void (null as unknown as [PublicInstanceExact, PublicCapabilitiesExact, PublicInputExact, PublicOutputExact, PublicRouterClientExact, PublicReactRegistryExact])
