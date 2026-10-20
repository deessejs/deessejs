import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { config, proxy } from "../proxy"

const ORIGIN = "https://app.deessejs.com"

/**
 * Stubs the proxy's self-fetch to `/api/v1/auth/get-session`.
 *
 * The proxy resolves the session over HTTP instead of importing
 * better-auth (see the comment in `apps/app/proxy.ts`): the import
 * path pulls `postgres` in, which Turbopack cannot bundle. The test
 * therefore drives the same seam the proxy uses in production.
 */
function stubSession(
  options: { signedIn?: boolean; emailVerified?: boolean } = {},
) {
  const { signedIn = true, emailVerified = true } = options
  const fetchMock = vi.fn().mockResolvedValue({
    ok: true,
    json: async () =>
      signedIn
        ? {
            session: { id: "session-1" },
            user: { emailVerified, role: "user" },
          }
        : null,
  })
  vi.stubGlobal("fetch", fetchMock)
  return fetchMock
}

function request(path: string): NextRequest {
  return new NextRequest(`${ORIGIN}${path}`)
}

function locationOf(response: Response): URL {
  const location = response.headers.get("location")
  if (location === null) {
    throw new Error("expected a redirect, got a response without Location")
  }
  return new URL(location)
}

afterEach(() => {
  vi.unstubAllGlobals()
})

describe("proxy: the legacy settings paths", () => {
  it("redirects a signed-in visitor to the new path", async () => {
    stubSession()
    const response = await proxy(request("/settings/profile"))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/account/settings/profile")
  })

  it("redirects the legacy hub to the profile leaf", async () => {
    stubSession()
    const response = await proxy(request("/settings"))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/account/settings/profile")
  })

  it("preserves every segment of a nested legacy path", async () => {
    stubSession()
    const response = await proxy(request("/settings/account/delete"))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe(
      "/account/settings/account/delete",
    )
  })

  it("carries the query string across the redirect", async () => {
    stubSession()
    const response = await proxy(request("/settings/profile?tab=security"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/account/settings/profile")
    expect(target.search).toBe("?tab=security")
  })

  it("leaves a path that only shares the prefix alone", async () => {
    stubSession()
    const response = await proxy(request("/settings-something"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("does not redirect the new paths", async () => {
    stubSession()
    const response = await proxy(request("/account/settings/profile"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })
})

describe("proxy: the gate still covers the legacy paths", () => {
  it("bounces a signed-out visitor to login, keeping the legacy path as the return target", async () => {
    stubSession({ signedIn: false })
    const response = await proxy(request("/settings/profile"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    // The return target is the path the visitor actually asked for.
    // The legacy redirect runs after the gate, so the path survives
    // until they are signed in.
    expect(target.searchParams.get("redirect")).toBe("/settings/profile")
  })

  it("bounces a signed-out visitor to login on the new path too", async () => {
    stubSession({ signedIn: false })
    const response = await proxy(request("/account/settings/profile"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe(
      "/account/settings/profile",
    )
  })

  it("sends an unverified visitor to verify-email, not to the new path", async () => {
    stubSession({ emailVerified: false })
    const response = await proxy(request("/settings/profile"))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/verify-email")
  })

  it("treats a failed session lookup as signed out", async () => {
    // The legacy redirect only fires for a signed-in visitor. When the
    // session endpoint itself fails, the proxy has no session to act
    // on and must fall back to the gate, not to the redirect.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => null }),
    )
    const response = await proxy(request("/settings/profile"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe("/settings/profile")
  })
})

describe("proxy: the matcher", () => {
  it("covers the new account settings paths", () => {
    expect(config.matcher).toContain("/account/settings/:path*")
  })

  it("keeps covering the legacy settings paths", () => {
    // There is no `/settings/*` page in the filesystem any more. If
    // the legacy prefix fell out of the matcher, the proxy would not
    // run for those paths and they would 404 instead of redirecting.
    // No behaviour test above would catch it, because the proxy is
    // what the request never reaches.
    expect(config.matcher).toContain("/settings/:path*")
  })
})
