import { memoryAdapter } from "@better-auth/memory-adapter"
import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import { os, type RouterClient } from "@orpc/server"
import { username } from "better-auth/plugins"
import { Hono } from "hono"
import { z } from "zod"
import { describe, expect, it, vi } from "vitest"
import { createDeesse, plugin } from "../src/index.js"
import type { AnyPlugin, DatabaseAdapter, DeesseDatabaseCapabilities, DeesseDatabaseService, DeesseRequestContext } from "../src/types.js"
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

  it("rejects duplicate IDs, missing/self requirements, and dependency cycles before handlers run", () => {
    const handler = vi.fn(() => ({}))
    const auth = { baseURL: "http://localhost", secret: "deesse-plugin-validation-secret-long-enough" }
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter
    const feature = plugin({ id: "feature", handler })
    const featureDuplicate = plugin({ id: "feature", handler })
    const missing = plugin({ id: "missing", requires: ["provider"], handler })
    const self = plugin({ id: "self", requires: ["self"], handler })
    const left = plugin({ id: "left", requires: ["right"], handler })
    const right = plugin({ id: "right", requires: ["left"], handler })
    const create = <const TPlugins extends readonly AnyPlugin[]>(plugins: TPlugins) => createDeesse({ database, auth, plugins })

    expect(() => create([feature(), featureDuplicate()])).toThrow("Duplicate Deesse plugin id: feature")
    expect(() => create([missing()])).toThrow("Plugin missing requires missing plugin provider")
    expect(() => create([self()])).toThrow("Deesse plugin dependency cycle at: self")
    expect(() => create([left(), right()])).toThrow("Deesse plugin dependency cycle at:")
    expect(handler).not.toHaveBeenCalled()
  })

  it("runs required plugin handlers once in dependency order and rejects duplicate models", () => {
    const calls: string[] = []
    const provider = plugin({
      id: "provider",
      handler: () => {
        calls.push("provider")
        return {
          database: {
            schema: { first: { fields: { title: { type: "string" } } } },
          },
        }
      },
    })
    const consumer = plugin({
      id: "consumer",
      requires: ["provider"],
      handler: () => {
        calls.push("consumer")
        return {
          database: {
            schema: { second: { fields: { title: { type: "string" } } } },
          },
        }
      },
    })
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
      initializeSchema: vi.fn(),
    } satisfies DatabaseAdapter
    const auth = { baseURL: "http://localhost", secret: "deesse-plugin-order-secret-long-enough" }
    createDeesse({ database, auth, plugins: [consumer(), provider()] })
    expect(calls).toEqual(["provider", "consumer"])
    expect(database.initializeSchema).toHaveBeenCalledTimes(1)
    expect(Object.keys(database.initializeSchema.mock.calls[0]?.[0] ?? {})).toEqual(["first", "second"])

    const duplicateModel = plugin({
      id: "duplicate",
      handler: () => ({
        database: { schema: { first: { fields: { title: { type: "string" } } } } },
      }),
    })
    expect(() => createDeesse({ database, auth, plugins: [provider(), duplicateModel()] })).toThrow("contributes duplicate database model: first")
  })

  it("passes Zod-defaulted plugin args to the handler exactly once", () => {
    let parseCount = 0
    const handler = vi.fn((_args: { limit: number }) => ({}))
    const configurable = plugin({
      id: "configured",
      args: z.object({ limit: z.number().default(10) }).transform((args) => {
        parseCount += 1
        return args
      }),
      handler,
    })
    const registration = configurable({})
    expect(registration.args).toEqual({})
    expect(parseCount).toBe(0)
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter

    createDeesse({
      database,
      auth: { baseURL: "http://localhost", secret: "deesse-zod-args-test-secret-long-enough" },
      plugins: [registration],
    })

    expect(registration.args).toEqual({})
    expect(parseCount).toBe(1)
    expect(handler).toHaveBeenCalledTimes(1)
    expect(handler).toHaveBeenCalledWith({ limit: 10 })
  })

  it("parses every plugin registration before invoking handlers", () => {
    const validHandler = vi.fn((_args: { limit: number }) => ({}))
    const handler = vi.fn((_args: { limit: number }) => ({}))
    const valid = plugin({ id: "valid", args: z.object({ limit: z.number() }), handler: validHandler })
    const configurable = plugin({
      id: "validated",
      args: z.object({ limit: z.number().default(10) }),
      handler,
    })
    const validRegistration = valid({ limit: 3 })
    const invalidRegistration = configurable({ limit: "not-a-number" } as never)
    expect(invalidRegistration.args).toEqual({ limit: "not-a-number" })

    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter

    expect(() => createDeesse({
      database,
      auth: { baseURL: "http://localhost", secret: "deesse-invalid-args-test-secret-long-enough" },
      plugins: [validRegistration, invalidRegistration],
    })).toThrow()
    expect(validHandler).not.toHaveBeenCalled()
    expect(handler).not.toHaveBeenCalled()
  })

  it("rejects invalid plugin model declarations before schema initialization", () => {
    const initializeSchema = vi.fn()
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
      initializeSchema,
    } satisfies DatabaseAdapter
    const auth = { baseURL: "http://localhost", secret: "deesse-schema-validation-secret-long-enough" }
    const unknownTypeSchema = { posts: { fields: { title: { type: "unknown" } } } } as never
    const unknownIndexSchema = { posts: { fields: { title: { type: "string" } }, indexes: [{ fields: ["missing"] }] } } as never
    const invalidType = plugin({
      id: "invalid-type",
      handler: () => ({ database: { schema: unknownTypeSchema } }),
    })
    const invalidIndex = plugin({
      id: "invalid-index",
      handler: () => ({ database: { schema: unknownIndexSchema } }),
    })
    expect(() => createDeesse({ database, auth, plugins: [invalidType()] })).toThrow("has an unsupported type")
    expect(() => createDeesse({ database, auth, plugins: [invalidIndex()] })).toThrow("index references unknown field: missing")
    expect(initializeSchema).not.toHaveBeenCalled()
  })

  it("composes generic Better Auth server plugins into the owned instance", () => {
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter
    const contributing = plugin({ id: "auth-extension", handler: () => ({ auth: { serverPlugins: [username()] } }) })
    const app = createDeesse({
      database,
      auth: {
        baseURL: "http://localhost",
        secret: "deesse-auth-contribution-secret-long-enough",
      },
      plugins: [contributing()],
    })
    expect((app.auth.options.plugins as { id: string }[]).map(({ id }) => id)).toContain("username")
    expect(app.auth.api).toHaveProperty("isUsernameAvailable")
  })

  it("serializes invalid oRPC input and keeps request users isolated", async () => {
    const echo = base.input(z.object({ value: z.string() })).handler(({ input, context }) => ({ value: input.value, userId: context.user?.id ?? null }))
    const feature = plugin({ id: "feature", handler: () => ({ api: { router: { echo } } }) })
    const database = {
      database: { capabilities: { transactions: true as const } } as unknown as DeesseDatabaseService,
      authAdapter: memoryAdapter({ user: [], session: [], account: [], verification: [] }),
    } satisfies DatabaseAdapter
    const app = createDeesse({
      database,
      auth: { baseURL: "http://localhost", secret: "deesse-request-scope-secret-long-enough", emailAndPassword: { enabled: true } },
      plugins: [feature()],
    })
    const client = createORPCClient(new RPCLink({ url: "http://localhost/api/rpc", fetch: (request, init) => app.handler(new Request(request, init)) })) as RouterClient<typeof app.api.router>
    await expect((client.feature.echo as unknown as (input: { value: number }) => Promise<unknown>)({ value: 1 })).rejects.toMatchObject({ code: "BAD_REQUEST" })

    const requestIdentity = async (email: string) => {
      const signup = await app.handler(new Request("http://localhost/api/auth/sign-up/email", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password: "password-12345", name: email }),
      }))
      expect(signup.status).toBe(200)
      const body = await signup.json() as { user: { id: string } }
      const cookie = signup.headers.get("set-cookie")
      expect(cookie).toBeTruthy()
      const requestClient = createORPCClient(new RPCLink({
        url: "http://localhost/api/rpc",
        fetch: (request, init) => {
          const routedRequest = new Request(request, init as RequestInit | undefined)
          const headers = new Headers(routedRequest.headers)
          headers.set("cookie", cookie as string)
          return app.handler(new Request(routedRequest, { headers }))
        },
      })) as RouterClient<typeof app.api.router>
      return { id: body.user.id, response: await requestClient.feature.echo({ value: "request" }) }
    }
    const [first, second] = await Promise.all([
      requestIdentity(`first-${crypto.randomUUID()}@example.test`),
      requestIdentity(`second-${crypto.randomUUID()}@example.test`),
    ])
    expect(first.response.userId).toBe(first.id)
    expect(second.response.userId).toBe(second.id)
    expect(first.response.userId).not.toBe(second.response.userId)
  })

  it("forwards request and response fields through the real Hono Next adapter", async () => {
    const hono = new Hono()
    hono.all("*", async (context) => {
      const body = await context.req.text()
      return context.json({ method: context.req.method, path: context.req.path, query: context.req.query("q"), body, cookie: context.req.header("cookie"), custom: context.req.header("x-smoke") }, 207, { "x-forwarded-response": "yes", "set-cookie": "smoke=1; Path=/" })
    })
    const next = toNextJsHandler({ handler: async (request) => await hono.fetch(request) })
    const response = await next(new Request("http://localhost/api/bridge?q=encoded%20value", {
      method: "PATCH",
      headers: { cookie: "session=abc", "content-type": "text/plain", "x-smoke": "request-header" },
      body: "request-body",
    }))
    expect(response.status).toBe(207)
    expect(response.headers.get("x-forwarded-response")).toBe("yes")
    expect(response.headers.get("set-cookie")).toContain("smoke=1")
    await expect(response.json()).resolves.toEqual({ method: "PATCH", path: "/api/bridge", query: "encoded value", body: "request-body", cookie: "session=abc", custom: "request-header" })
  })
})
