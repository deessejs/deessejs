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

const orpcEnvelope = (templates: unknown) =>
  JSON.stringify({ result: { data: { templates } } })

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
        new Response(orpcEnvelope(validTemplates), {
          status: 200,
          headers: { "content-type": "application/json" },
        }),
      ),
    )
    const result = await fetchTemplates("http://fake", { skipVersionCheck: true })
    expect(result).toEqual(validTemplates)
  })

  it("throws network_error on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not found", { status: 404 })),
    )
    await expect(
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "network_error" })
  })

  it("throws network_error on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("server error", { status: 500 })),
    )
    await expect(
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "network_error" })
  })

  it("throws network_error on connection refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    )
    await expect(
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "network_error" })
  })

  it("throws parse_error on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    )
    await expect(
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "parse_error" })
  })

  it("throws parse_error when templates key missing in unwrapped payload", async () => {
    // oRPC envelope wraps a payload that lacks `templates` after unwrap.
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
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "parse_error" })
  })

  it("throws parse_error when a required field is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          orpcEnvelope([
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
      fetchTemplates("http://fake", { skipVersionCheck: true }),
    ).rejects.toMatchObject({ code: "parse_error" })
  })
})
