import { NextRequest } from "next/server"
import { afterEach, describe, expect, it, vi } from "vitest"

import { SETTINGS_PATHS, SETTINGS_PREFIX } from "../lib/settings-paths"
import { NO_ORGANIZATION_PATH } from "../lib/workspace-paths"
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

describe("proxy: the workspace is protected", () => {
  it("bounces a signed-out visitor away from a workspace path", async () => {
    // A first segment the application does not own is an organization
    // slug, and the organization tree needs a session.
    stubSession({ signedIn: false })
    const response = await proxy(request("/acme/home"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe("/acme/home")
  })

  it("protects the empty state", async () => {
    stubSession({ signedIn: false })
    const response = await proxy(request(NO_ORGANIZATION_PATH))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/login")
  })

  it("protects a workspace settings path", async () => {
    // The classification is what protects it: the first segment is an
    // organization slug, so the whole tree under it needs a session.
    stubSession({ signedIn: false })
    const response = await proxy(request("/acme/settings/organization"))

    expect(response.status).toBe(307)
    const target = locationOf(response)
    expect(target.pathname).toBe("/login")
    expect(target.searchParams.get("redirect")).toBe(
      "/acme/settings/organization",
    )
  })

  it("lets a signed-in visitor into a workspace settings path", async () => {
    stubSession()
    const response = await proxy(request("/acme/settings/organization"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("lets a signed-in visitor into the workspace", async () => {
    stubSession()
    const response = await proxy(request("/acme/home"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
  })

  it("sends an unverified visitor to verify-email", async () => {
    stubSession({ emailVerified: false })
    const response = await proxy(request("/acme/home"))

    expect(response.status).toBe(307)
    expect(locationOf(response).pathname).toBe("/verify-email")
  })
})

describe("proxy: the classification", () => {
  it("does not gate a path the application owns but does not serve", async () => {
    // The segment is reserved, so it is an application route, and
    // the per-prefix rules say it is not one of ours. The proxy does
    // not even ask for a session.
    const fetchMock = stubSession()
    const response = await proxy(request("/onboarding"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not gate a file", async () => {
    // A segment with an extension is a file, whatever its first
    // segment is.
    const fetchMock = stubSession()
    const response = await proxy(request("/favicon.ico"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not gate a nested asset", async () => {
    const fetchMock = stubSession()
    const response = await proxy(request("/logos/anthropic.svg"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })

  it("does not gate the API mount", async () => {
    const fetchMock = stubSession()
    const response = await proxy(request("/api/v1/rpc/organization/create"))

    expect(response.status).toBe(200)
    expect(response.headers.get("location")).toBeNull()
    expect(fetchMock).not.toHaveBeenCalled()
  })
})

describe("proxy: the matcher", () => {
  it("covers the workspace tree, whose first segment is not known in advance", () => {
    // A literal list cannot express it, so the matcher is a regular
    // expression, and it leaves the API mount and the framework's own
    // files out.
    expect(config.matcher).toContain(
      "/((?!api(?:/|$)|_next(?:/|$))[^/]+(?:/.*)?)",
    )
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
