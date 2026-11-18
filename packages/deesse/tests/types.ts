import type { BetterAuthOptions } from "better-auth"
import { os } from "@orpc/server"
import { z } from "zod"
import { createDeesse, plugin } from "../src/index.js"
import { createClient } from "../src/react.js"

const procedures = os.router({ list: os.output(z.array(z.string())).handler(() => ["ok"] as const) })
const feature = plugin({
  id: "feature",
  args: z.object({ count: z.number().default(3) }),
  handler: (args) => {
    const count: number = args.count
    // @ts-expect-error handler receives parsed args only, not runtime services
    void args.database
    return { api: { router: procedures }, count }
  },
})
const database = { database: { capabilities: { transactions: true as const } }, authAdapter: { adapter: true } }
const auth = { baseURL: "https://example.test", plugins: [] } satisfies BetterAuthOptions
const app = createDeesse({ database, auth, api: {}, plugins: [feature({})] })
const registered = app.options.plugins[0]
const count: number = registered.args.count
// @ts-expect-error the parsed output contains the defaulted count
const rawCount: undefined = registered.args.count
const client = createClient<typeof app.types.router>()
void client.auth.signIn
void client.api.feature.list
const authPluginTypes: BetterAuthOptions["plugins"] = app.options.auth.plugins
void [count, rawCount, authPluginTypes]
