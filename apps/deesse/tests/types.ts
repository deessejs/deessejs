import type { BetterAuthOptions } from "better-auth"
import { os } from "@orpc/server"
import { organization } from "better-auth/plugins"
import { organizationClient } from "better-auth/client/plugins"
import { z } from "zod"
import { createDeesse, plugin } from "deesse"
import { createClient } from "deesse/react"

const procedures = os.router({ list: os.output(z.array(z.string())).handler(() => ["ok"] as const) })
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
const app = createDeesse({ database, auth, api: {}, plugins: [feature({})] })
void app.auth.api.createOrganization
const registration = feature({})
const count: number = registration.args.count
// @ts-expect-error schema defaults are present in parsed output
const missing: undefined = registration.args.count
const portableTransactions: true = app.database.capabilities.transactions
// @ts-expect-error provider adapter internals are not exposed on the instance
void app.database.authAdapter
void minimalApp.api.router

declare module "deesse/react" {
  interface DeesseReactRegistry {
    app: { router: typeof app.api.router; authOptions: { plugins: [typeof orgClient] } }
  }
}

const client = createClient()
void client.auth.organization
void client.api.feature.list
void [count, missing, portableTransactions]
