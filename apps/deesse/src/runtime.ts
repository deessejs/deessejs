import { betterAuth } from "better-auth"
import { RPCHandler } from "@orpc/server/fetch"
import { Hono } from "hono"
import { DEESSE_AUTH_PATH, DEESSE_RPC_PATH } from "./paths.js"
import type { AnyRouter, DeesseFetchHandler, PluginContribution } from "./types.js"
import type { RuntimeOptions, RuntimePlugin } from "./runtime-types.js"

function orderedPlugins(plugins: readonly RuntimePlugin[]): readonly RuntimePlugin[] {
  const byId = new Map<string, RuntimePlugin>()
  for (const item of plugins) {
    if (byId.has(item.id)) throw new Error(`Duplicate Deesse plugin id: ${item.id}`)
    byId.set(item.id, item)
  }

  const ordered: RuntimePlugin[] = []
  const visiting = new Set<string>()
  const visited = new Set<string>()
  const visit = (item: RuntimePlugin): void => {
    if (visited.has(item.id)) return
    if (visiting.has(item.id)) throw new Error(`Deesse plugin dependency cycle at: ${item.id}`)
    visiting.add(item.id)
    for (const required of item.definition.requires ?? []) {
      const dependency = byId.get(required)
      if (!dependency) throw new Error(`Plugin ${item.id} requires missing plugin ${required}`)
      visit(dependency)
    }
    visiting.delete(item.id)
    visited.add(item.id)
    ordered.push(item)
  }
  for (const item of plugins) visit(item)
  return ordered
}

function contributionOf(item: RuntimePlugin): PluginContribution {
  const handler = item.definition.handler as unknown as (args?: unknown) => PluginContribution
  return "args" in item ? handler(item.args) : handler()
}

export function createRuntime(options: RuntimeOptions): {
  database: RuntimeOptions["database"]["database"]
  auth: unknown
  api: { router: AnyRouter }
  handler: DeesseFetchHandler
} {
  const plugins = orderedPlugins(options.plugins ?? [])
  const contributions = plugins.map((item) => ({ item, contribution: contributionOf(item) }))
  const serverPlugins = contributions.flatMap(({ contribution }) => contribution.auth?.serverPlugins ?? [])
  const pluginRouters = Object.fromEntries(contributions.flatMap(({ item, contribution }) =>
    contribution.api?.router ? [[item.id, contribution.api.router]] : []))
  const router = { ...(options.api?.router ?? {}), ...pluginRouters } as AnyRouter
  const authOptions = {
    ...options.auth,
    database: options.database.authAdapter,
    plugins: [...(options.auth.plugins ?? []), ...serverPlugins],
  }
  const auth = betterAuth(authOptions)
  const app = new Hono()
  app.on(["GET", "POST"], `${DEESSE_AUTH_PATH}/*`, (context) => auth.handler(context.req.raw))
  const rpc = new RPCHandler(router)
  app.all(`${DEESSE_RPC_PATH}/*`, async (context) => {
    const getSession = auth.api.getSession as unknown as (input: { headers: Headers }) => Promise<{ session: object; user: object } | null>
    const session = await getSession({ headers: context.req.raw.headers })
    const result = await rpc.handle(context.req.raw, {
      prefix: DEESSE_RPC_PATH,
      context: { headers: context.req.raw.headers, session: session?.session ?? null, user: session?.user ?? null },
    })
    return result.matched ? result.response : context.notFound()
  })
  return {
    database: options.database.database,
    auth: auth as unknown,
    api: { router },
    handler: async (request) => app.fetch(request),
  }
}
