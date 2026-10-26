import { afterEach, describe, expect, it, vi } from "vitest"

/**
 * The signup proxy of the marketing site.
 *
 * The browser cannot call the API directly: a preview deployment of
 * the API is protected by Vercel, and Vercel answers a CORS preflight
 * with a redirect the browser cannot follow. The proxy runs on the
 * same origin as the page and calls the API from the server.
 *
 * Two things have to hold for that to work:
 *
 *   1. the call carries the header Vercel's deployment protection
 *      expects, read from the server environment;
 *   2. the call carries the visitor's address, so the API's per-IP
 *      rate limit stays per visitor.
 */

const jsonResponse = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  })

const signupRequest = (body: unknown, headers: Record<string, string> = {}) =>
  new Request("http://localhost:3000/api/playbook/signup", {
    method: "POST",
    headers: { "content-type": "application/json", ...headers },
    body: JSON.stringify(body),
  })

/**
 * The route module reads the server environment, which is memoised on
 * first use, so the module is re-imported per case with the
 * environment stubbed first.
 */
const loadPost = async () => {
  vi.resetModules()
  const mod = await import("../../src/app/api/playbook/signup/route.js")
  return mod.POST
}

describe("POST /api/playbook/signup", () => {
  afterEach(() => {
    vi.unstubAllGlobals()
    vi.unstubAllEnvs()
  })

  it("calls the API with the protection bypass and the visitor address", async () => {
    vi.stubEnv("API_PROTECTION_BYPASS_SECRET", "bypass-secret-value")
    const fetchMock = vi.fn().mockImplementation(async () =>
      jsonResponse({ json: { ok: true } }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const POST = await loadPost()
    const response = await POST(
      signupRequest(
        { email: "reader@example.com", consentMarketing: false },
        { "x-forwarded-for": "203.0.113.7" },
      ),
    )

    expect(response.status).toBe(200)
    await expect(response.json()).resolves.toEqual({ ok: true })

    const request = fetchMock.mock.calls[0]?.[0] as Request
    const headers = new Headers(
      (fetchMock.mock.calls[0] as [Request, RequestInit | undefined])[1]
        ?.headers,
    )
    expect(request.url).toContain("/api/v1/rpc/playbook/signup")
    expect(headers.get("x-vercel-protection-bypass")).toBe(
      "bypass-secret-value",
    )
    // Vercel overwrites the client-supplied header at the edge, so
    // the value the proxy forwards is the visitor's address.
    expect(headers.get("x-forwarded-for")).toBe("203.0.113.7")
    // The headers the oRPC client set on the request survive the
    // merge: `fetch` replaces the request headers with the init ones.
    expect(headers.get("content-type")).toBe("application/json")
  })

  it("omits the bypass header when the secret is not configured", async () => {
    vi.stubEnv("API_PROTECTION_BYPASS_SECRET", "")
    const fetchMock = vi.fn().mockImplementation(async () =>
      jsonResponse({ json: { ok: true } }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const POST = await loadPost()
    await POST(signupRequest({ email: "reader@example.com" }))

    const headers = new Headers(
      (fetchMock.mock.calls[0] as [Request, RequestInit | undefined])[1]
        ?.headers,
    )
    expect(headers.get("x-vercel-protection-bypass")).toBeNull()
  })

  it("rejects a malformed address before calling the API", async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal("fetch", fetchMock)

    const POST = await loadPost()
    const response = await POST(signupRequest({ email: "not-an-email" }))

    expect(response.status).toBe(400)
    await expect(response.json()).resolves.toMatchObject({
      code: "BAD_REQUEST",
    })
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("maps the wire code the API returned to a status", async () => {
    vi.stubEnv("API_PROTECTION_BYPASS_SECRET", "bypass-secret-value")
    const fetchMock = vi.fn().mockImplementation(async () =>
      jsonResponse(
        {
          json: {
            defined: false,
            code: "RATE_LIMITED",
            status: 429,
            message: "You've sent a few signups recently.",
          },
        },
        429,
      ),
    )
    vi.stubGlobal("fetch", fetchMock)

    const POST = await loadPost()
    const response = await POST(
      signupRequest({ email: "reader@example.com" }),
    )

    expect(response.status).toBe(429)
    await expect(response.json()).resolves.toMatchObject({
      code: "RATE_LIMITED",
    })
  })

  it("does not report a success when the deployment answered with a redirect", async () => {
    vi.stubEnv("API_PROTECTION_BYPASS_SECRET", "bypass-secret-value")
    const fetchMock = vi.fn().mockImplementation(async () =>
      new Response("<html>redirect to the sign-in page</html>", {
        status: 302,
        headers: { "content-type": "text/html" },
      }),
    )
    vi.stubGlobal("fetch", fetchMock)

    const POST = await loadPost()
    const response = await POST(
      signupRequest({ email: "reader@example.com" }),
    )

    // A redirect to Vercel's sign-in page is not an RPC result. The
    // client resolves with `undefined` there, and the visitor must
    // not be told the email is on its way.
    expect(response.status).toBe(502)
    await expect(response.json()).resolves.toMatchObject({
      code: "EMAIL_SEND_FAILED",
    })
  })
})
