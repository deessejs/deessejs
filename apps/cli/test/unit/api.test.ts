import { vi, describe, it, expect, beforeEach, afterEach } from "vitest"

const { fetchTemplates } = await import("../../src/api.js")

const validTemplates = [
  {
    slug: "x",
    name: "X",
    description: "d",
    owner: "o",
    repo: "r",
    license: "MIT",
    category: "c",
    labels: [],
  },
]

/**
 * Wire shapes for the two outcomes the CLI handles:
 *   - success: { result: { data: { templates } } }
 *   - ORPCError: { defined, code, status, message, data }
 */
const successBody = (templates: unknown) =>
  JSON.stringify({ result: { data: { templates } } })

const errorBody = (code: string, status: number, message: string) =>
  JSON.stringify({ defined: false, code, status, message, data: {} })

const noRetry = { skipVersionCheck: true, maxAttempts: 1 }

describe("fetchTemplates", () => {
  beforeEach(() => {
    vi.unstubAllGlobals()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("returns templates on 200 (unwraps oRPC envelope)", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(successBody(validTemplates), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    const result = await fetchTemplates("http://fake", noRetry)
    expect(result).toEqual(validTemplates)
  })

  it("surfaces ORPCError RATE_LIMITED on 429 as parse_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          errorBody("RATE_LIMITED", 429, "Too many requests. Try again in 60s."),
          {
            status: 429,
            headers: { "content-type": "application/json" },
          },
        ),
      ),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({
      code: "parse_error",
      message: expect.stringContaining("RATE_LIMITED"),
    })
  })

  it("surfaces ORPCError NOT_FOUND on 404 as parse_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(errorBody("NOT_FOUND", 404, "Route not found"), {
          status: 404,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({
      code: "parse_error",
      message: expect.stringContaining("NOT_FOUND"),
    })
  })

  it("surfaces ORPCError INTERNAL_SERVER_ERROR on 500 as parse_error", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(errorBody("INTERNAL_SERVER_ERROR", 500, "Boom"), {
          status: 500,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({
      code: "parse_error",
      message: expect.stringContaining("INTERNAL_SERVER_ERROR"),
    })
  })

  it("throws network_error on connection refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new TypeError("fetch failed")),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({ code: "network_error" })
  })

  it("throws network_error on malformed (non-JSON) response body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({ code: "network_error" })
  })

  it("throws parse_error when the templates field is missing in the success body", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({ result: { data: { data: [] } } }),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({ code: "parse_error" })
  })

  it("throws parse_error when a required template field is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          successBody([
            {
              // slug missing
              name: "X",
              description: "d",
              owner: "o",
              repo: "r",
              license: "MIT",
              category: "c",
              labels: [],
            },
          ]),
          { status: 200, headers: { "content-type": "application/json" } },
        ),
      ),
    )
    await expect(
      fetchTemplates("http://fake", noRetry),
    ).rejects.toMatchObject({ code: "parse_error" })
  })
})
