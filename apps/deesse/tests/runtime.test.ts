import { memoryAdapter } from "@better-auth/memory-adapter"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { os, type RouterClient } from "@orpc/server"
import { describe, expect, it, vi } from "vitest"
import { createDeesse, plugin } from "../src/index.js"
import type { DatabaseAdapter, DeesseDatabaseCapabilities, DeesseDatabaseService, DeesseRequestContext } from "../src/types.js"
import { toNextJsHandler } from "../src/next.js"

type RequestContext = DeesseRequestContext<never, DeesseDatabaseCapabilities, { id: string }>
const base = os.$context<RequestContext>()

describe("Deesse runtime composition", () => {
  it("runs plugin handlers once and serves public and authenticated oRPC calls through Hono", async () => {
    const identity = base.handler(({ context }) => {
      const transactions: true = context.database.capabilities.transactions
      const method: string = context.request.method
      void [transactions, method]
      return context.user?.id ?? "anonymous"
    })
    const handler = vi.fn(() => ({ api: { router: { identity } } }))
    const feature = plugin({ id: "feature", handler })
    const authOptions = {
      baseURL: "http://localhost",
      secret: "deesse-runtime-test-secret-which-is-long-enough",
      emailAndPassword: { enabled: true },
    }
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter
    const app = createDeesse({
      database,
      auth: authOptions,
      plugins: [feature()],
    })

    expect(handler).toHaveBeenCalledTimes(1)
    const hostClient = createORPCClient(new RPCLink({ url: "http://localhost/api/rpc", fetch: (request, init) => app.handler(new Request(request, init)) })) as RouterClient<typeof app.api.router>
    expect(await hostClient.feature.identity()).toBe("anonymous")

    const signup = await app.handler(new Request("http://localhost/api/auth/sign-up/email", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ email: "runtime@example.test", password: "password-12345", name: "Runtime User" }),
    }))
    expect(signup.status).toBe(200)
    const created = await signup.json() as { user: { id: string } }
    const cookie = signup.headers.get("set-cookie")
    expect(cookie).toBeTruthy()
    const authenticatedClient = createORPCClient(new RPCLink({
      url: "http://localhost/api/rpc",
      fetch: (request) => {
        const headers = new Headers(request.headers)
        headers.set("cookie", cookie as string)
        return app.handler(new Request(request, { headers }))
      },
    })) as RouterClient<typeof app.api.router>
    expect(await authenticatedClient.feature.identity()).toBe(created.user.id)

    const next = toNextJsHandler(app)
    const mounted = await next(new Request("http://localhost/not-found"))
    expect(mounted.status).toBe(404)
  })

  it("rejects a plugin namespace that would overwrite an application router key", () => {
    const appHandler = base.handler(() => "application")
    const pluginHandler = base.handler(() => "plugin")
    const feature = plugin({ id: "feature", handler: () => ({ api: { router: { status: pluginHandler } } }) })
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter
    const auth = {
      baseURL: "http://localhost",
      secret: "deesse-runtime-collision-test-secret-long-enough",
      emailAndPassword: { enabled: true },
    }

    expect(() => createDeesse({
      database,
      auth,
      api: { router: { feature: appHandler } },
      plugins: [feature()],
    })).toThrow('Deesse plugin router namespace conflicts with application router key: feature')
  })
})
