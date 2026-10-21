import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SETTINGS_PATHS, SETTINGS_PREFIX } from "../lib/settings-paths"
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

describe("proxy: the account settings are protected", () => {
  it("bounces a signed-out visitor to login", async () => {
    stubSession({ signedIn: false })
    const response = await proxy(request(SETTINGS_PATHS.profile))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe(SETTINGS_PATHS.profile)
  })

  it("protects the prefix itself, not only its leaves", async () => {
    stubSession({ signedIn: false })
    const response = await proxy(request(SETTINGS_PREFIX))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe(SETTINGS_PREFIX)
  })

  it("sends an unverified visitor to verify-email", async () => {
    stubSession({ emailVerified: false })
    const response = await proxy(request(SETTINGS_PATHS.profile))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/verify-email")
  })

  it("lets a signed-in, verified visitor through", async () => {
    stubSession()
    const response = await proxy(request(SETTINGS_PATHS.profile))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("treats a failed session lookup as signed out", async () => {
    // The session endpoint is the proxy's only source of truth for
    // who the caller is. When it fails, there is no session to act on
    // and the gate has to hold.
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({ ok: false, json: async () => null }),
    )
    const response = await proxy(request(SETTINGS_PATHS.profile))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe(SETTINGS_PATHS.profile)
  })
})

describe("proxy: the matcher", () => {
  it("covers the account settings", () => {
    expect(config.matcher).toContain(`${SETTINGS_PREFIX}/:path*`)
  })

  it("does not cover a prefix that no longer exists", () => {
    // The settings used to live at `/settings/*`. No page sits under
    // that prefix any more, and the app has no user whose bookmark
    // would land there, so the matcher must not claim it.
    expect(
      config.matcher.some((entry) => entry.startsWith("/settings")),
    ).toBe(false)
  })
})
