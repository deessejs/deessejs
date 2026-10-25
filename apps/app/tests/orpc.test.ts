import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

/**
 * The oRPC link, from the app's side.
 *
 * The link is how a server component reaches the API, and the session
 * travels in the cookie. A link that carries no headers sends the call
 * out as an anonymous request, and every procedure that reads the
 * session sees no caller: the refusal the API would send is the only
 * answer the app gets.
 *
 * The link is a client object, so the test asserts on the request it
 * builds. `fetch` is stubbed, and the request the link hands to it
 * carries the headers.
 *
 * The module is imported dynamically, after the stub is in place,
 * because the link binds `globalThis.fetch` when it is constructed.
 */

const { headersMock } = vi.hoisted(() => ({ headersMock: vi.fn() }))

vi.mock("next/headers", () => ({
  headers: headersMock,
}))

const SESSION_COOKIE = "better-auth.session_token=token.signature"

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

describe("the oRPC link", () => {
  beforeEach(() => {
    vi.resetModules()
    headersMock.mockReset()
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it("forwards the session cookie to the API", async () => {
    headersMock.mockResolvedValue(new Headers({ cookie: SESSION_COOKIE }))
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(rpcResponse())
    vi.stubGlobal("fetch", fetchMock)

    const { orpc } = await import("../lib/orpc")
    const organization = await orpc.organization.bySlug({ slug: "acme" })

    expect(organization).toEqual({
      id: "org-1",
      slug: "acme",
      name: "Acme",
      role: "owner",
    })

    const request = requestOf(fetchMock.mock.calls[0]?.[0])
    expect(request.method).toBe("POST")
    expect(new URL(request.url).pathname).toBe(
      "/api/v1/rpc/organization/bySlug",
    )
    expect(request.headers.get("cookie")).toBe(SESSION_COOKIE)
  })

  it("still reaches the API when there is no request scope", async () => {
    // `headers()` throws outside a request scope, and the link has to
    // survive it: a link option that throws takes the call down with
    // it. Outside a request there is no session to forward, so the
    // honest answer is no cookie.
    headersMock.mockImplementation(() => {
      throw new Error("outside a request scope")
    })
    const fetchMock = vi.fn<typeof fetch>()
    fetchMock.mockResolvedValue(rpcResponse())
    vi.stubGlobal("fetch", fetchMock)

    const { orpc } = await import("../lib/orpc")
    await orpc.organization.bySlug({ slug: "acme" })

    const request = requestOf(fetchMock.mock.calls[0]?.[0])
    expect(request.headers.get("cookie")).toBeNull()
  })
})
