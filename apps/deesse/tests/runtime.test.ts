import { memoryAdapter } from "@better-auth/memory-adapter"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { os, type RouterClient } from "@orpc/server"
import { describe, expect, it, vi } from "vitest"
import { createDeesse, plugin } from "../src/index.js"
import { toNextJsHandler } from "../src/next.js"

type RequestContext = { headers: Headers; session: object | null; user: { id: string } | null }
const base = os.$context<RequestContext>()

describe("Deesse runtime composition", () => {
  it("runs plugin handlers once and serves public and authenticated oRPC calls through Hono", async () => {
    const identity = base.handler(({ context }) => context.user?.id ?? "anonymous")
    const handler = vi.fn(() => ({ api: { router: { identity } } }))
    const feature = plugin({ id: "feature", handler })
    const authOptions = {
      baseURL: "http://localhost",
      secret: "deesse-runtime-test-secret-which-is-long-enough",
      emailAndPassword: { enabled: true },
    }
    const app = createDeesse({
      database: {
        database: { capabilities: { transactions: true as const } },
        authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
      },
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
})
