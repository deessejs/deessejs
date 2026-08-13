import {
  vi,
  describe,
  it,
  expect,
  beforeEach,
  afterEach,
} from "vitest"

import * as fetchWithRetryModule from "../../src/fetch-with-retry.js"

/**
 * Tests for the CLI's HTTP layer.
 *
 * Phase 3 of docs/engineering/plans/orpc-client-migration.md: we test
 * `orpcFetch` and the surrounding helpers directly, bypassing the
 * RPCLink transport. RPCLink's behavior is verified by the contract
 * tests + the production integration. The custom `fetch` hook here
 * is the boundary we own and want to assert.
 *
 * We mock `fetchWithRetry` (a module-local export) instead of
 * `vi.stubGlobal("fetch", ...)`. The global stub is the wrong layer
 * for testing RPCLink: it bypasses RPCLink entirely so the typed
 * client never runs and the wire contract never gets validated. The
 * module mock is local and explicit.
 */

const orpcFetchModule = await import("../../src/api.js")

vi.mock("../../src/fetch-with-retry.js", () => ({
  fetchWithRetry: vi.fn(),
}))

const fetchWithRetryMock = vi.mocked(fetchWithRetryModule.fetchWithRetry)

const VALID = [
  {
    slug: "saas-starter",
    name: "SaaS Starter",
    description: "Production-ready Next.js + Better Auth + Postgres boilerplate.",
    owner: "deessejs",
    repo: "saas-template",
    license: "MIT",
    category: "saas",
    labels: ["nextjs", "saas", "auth", "postgres"],
  },
]

const orpcEnvelope = (data: unknown): string =>
  JSON.stringify({ result: { data } })

const orpcError = (
  code: string,
  status: number,
  message: string,
  data: unknown = {},
): string => JSON.stringify({ defined: false, code, status, message, data })

const buildRequest = (): Request =>
  new Request("https://app.deessejs.com/api/v1/rpc/templates/list", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ "0": { json: null, meta: [] } }),
  })

const ORPC_NAMES = { templates: "templates" } as const

describe("orpcFetch (mocked fetchWithRetry)", () => {
  beforeEach(() => {
    fetchWithRetryMock.mockReset()
  })

  afterEach(() => {
    fetchWithRetryMock.mockReset()
  })

  it("returns a Response with status 200 and the body text from fetchWithRetry", async () => {
    fetchWithRetryMock.mockResolvedValue({
      status: 200,
      bodyText: orpcEnvelope({ templates: VALID }),
      etag: null,
    })

    const req = buildRequest()
    const res = await orpcFetchModule.orpcFetch(
      req,
      { redirect: undefined },
      {} as never,
      [ORPC_NAMES.templates, "list"] as const,
      undefined,
    )

    expect(res.status).toBe(200)
    expect(res.headers.get("content-type")).toBe("application/json")
    expect(await res.text()).toBe(orpcEnvelope({ templates: VALID }))
  })

  it("forwards method, headers, and body to fetchWithRetry", async () => {
    fetchWithRetryMock.mockResolvedValue({
      status: 200,
      bodyText: orpcEnvelope({ templates: VALID }),
      etag: null,
    })

    const req = buildRequest()
    await orpcFetchModule.orpcFetch(
      req,
      { redirect: undefined },
      {} as never,
      [ORPC_NAMES.templates, "list"] as const,
      undefined,
    )

    expect(fetchWithRetryMock).toHaveBeenCalledTimes(1)
    const opts = fetchWithRetryMock.mock.calls[0]?.[0] as {
      apiUrl: string
      method: string
      body: string
      headers: Record<string, string>
    }
    expect(opts.apiUrl).toBe(
      "https://app.deessejs.com/api/v1/rpc/templates/list",
    )
    expect(opts.method).toBe("POST")
    expect(opts.headers["content-type"]).toBe("application/json")
    expect(opts.body).toBe(
      JSON.stringify({ "0": { json: null, meta: [] } }),
    )
  })

  it("passes through 4xx status codes without transformation", async () => {
    fetchWithRetryMock.mockResolvedValue({
      status: 429,
      bodyText: orpcError(
        "RATE_LIMITED",
        429,
        "Too many requests.",
        { retryAfter: 60 },
      ),
      etag: null,
    })

    const req = buildRequest()
    const res = await orpcFetchModule.orpcFetch(
      req,
      { redirect: undefined },
      {} as never,
      [ORPC_NAMES.templates, "list"] as const,
      undefined,
    )

    expect(res.status).toBe(429)
    expect(res.headers.get("content-type")).toBe("application/json")
    expect(await res.text()).toBe(
      orpcError("RATE_LIMITED", 429, "Too many requests.", { retryAfter: 60 }),
    )
  })

  it("returns a 404 status with the ORPCError NOT_FOUND body for unmatched routes", async () => {
    fetchWithRetryMock.mockResolvedValue({
      status: 404,
      bodyText: orpcError("NOT_FOUND", 404, "Route not found"),
      etag: null,
    })

    const req = buildRequest()
    const res = await orpcFetchModule.orpcFetch(
      req,
      { redirect: undefined },
      {} as never,
      [ORPC_NAMES.templates, "list"] as const,
      undefined,
    )

    expect(res.status).toBe(404)
    expect(await res.text()).toBe(
      orpcError("NOT_FOUND", 404, "Route not found"),
    )
  })
})
