import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The oRPC link, from the browser's side.
 *
 * The create dialog is a client component, and the server client is a
 * server module, so the browser needs its own link. The link builds
 * the request with an absolute URL, and the only origin that is right
 * on every deployment is the page's own.
 *
 * The module is imported dynamically, after the stub is in place,
 * because the link binds `globalThis.fetch` when it is constructed.
 */
const ORIGIN = "https://app.example.com"

/** The answer the API gives a successful call. */
const rpcResponse = () =>
  new Response(
    JSON.stringify({
      json: { id: "org-1", slug: "acme", name: "Acme", role: "owner" },
    }),
    { status: 200, headers: { "content-type": "application/json" } },
  )

/** The request the link handed to `fetch`. */
const requestOf = (call: unknown): Request => {
  if (!(call instanceof Request)) {
    throw new Error("the link did not hand fetch a Request")
  }
  return call
}

describe("the browser oRPC link", () => {
  beforeEach(() => {
    vi.resetModules()
    vi.stubGlobal("window", { location: { origin: ORIGIN } })
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("posts to the RPC path on the page's own origin", async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(rpcResponse())
    vi.stubGlobal("fetch", fetchMock)

    const { orpcBrowser } = await import("../lib/orpc-browser")
    const created = await orpcBrowser.organization.create({ name: "Acme" })

    expect(created).toEqual({
      id: "org-1",
      slug: "acme",
      name: "Acme",
      role: "owner",
    })

    const request = requestOf(fetchMock.mock.calls[0]?.[0])
    expect(request.method).toBe("POST")
    const url = new URL(request.url)
    expect(url.origin).toBe(ORIGIN)
    expect(url.pathname).toBe("/api/v1/rpc/organization/create")
  })

  it("sets no cookie header, because the browser sends its own", async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(rpcResponse())
    vi.stubGlobal("fetch", fetchMock)

    const { orpcBrowser } = await import("../lib/orpc-browser")
    await orpcBrowser.organization.create({ name: "Acme" })

    const request = requestOf(fetchMock.mock.calls[0]?.[0])
    expect(request.headers.get("cookie")).toBeNull()
  })

  it("reads the origin when the request is made, not when the module loads", async () => {
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(rpcResponse())
    vi.stubGlobal("fetch", fetchMock)

    const { orpcBrowser } = await import("../lib/orpc-browser")

    // The page moved to another origin, which happens on a preview.
    vi.stubGlobal("window", { location: { origin: "https://preview.example" } })
    await orpcBrowser.organization.create({ name: "Acme" })

    const request = requestOf(fetchMock.mock.calls[0]?.[0])
    expect(new URL(request.url).origin).toBe("https://preview.example")
  })
})
