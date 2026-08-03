import { vi, describe, it, expect, beforeEach } from "vitest"
import { fetchTemplates } from "../../src/api.js"

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

describe("fetchTemplates", () => {
  beforeEach(() => {
    vi.restoreAllMocks()
  })

  it("returns templates on 200", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ templates: validTemplates }), {
          status: 200,
        }),
      ),
    )
    const result = await fetchTemplates("http://fake")
    expect(result).toEqual(validTemplates)
  })

  it("throws network_error on 404", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not found", { status: 404 })),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "network_error",
    })
  })

  it("throws network_error on 500", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("server error", { status: 500 })),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "network_error",
    })
  })

  it("throws network_error on connection refused", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("ECONNREFUSED")),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "network_error",
    })
  })

  it("throws parse_error on malformed JSON", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(new Response("not json", { status: 200 })),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "parse_error",
    })
  })

  it("throws parse_error when templates key missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(JSON.stringify({ data: [] }), { status: 200 }),
      ),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "parse_error",
    })
  })

  it("throws parse_error when a required field is missing", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue(
        new Response(
          JSON.stringify({
            templates: [
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
            ],
          }),
          { status: 200 },
        ),
      ),
    )
    await expect(fetchTemplates("http://fake")).rejects.toMatchObject({
      code: "parse_error",
    })
  })
})
