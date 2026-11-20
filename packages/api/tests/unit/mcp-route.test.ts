import { describe, expect, it } from "vitest"
import { api } from "../../src/index.js"
import { API_BASE_PATH } from "../../src/constants/base-path.js"
import { serverEnv } from "@workspace/env/server"

describe("MCP HTTP route", () => {
  const resourceUrl = new URL(serverEnv.MCP_RESOURCE_URL)
  const canonicalPath = resourceUrl.pathname
  const metadataPath = `/.well-known/oauth-protected-resource${canonicalPath}`
  const apiMetadataPath = `${API_BASE_PATH}${metadataPath}`
  const issuer = `${serverEnv.API_BASE_URL}${API_BASE_PATH}/auth`

  it("serves RFC 9728 metadata with the canonical resource and read-only scope", async () => {
    const response = await api.request(apiMetadataPath)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual({
      resource: serverEnv.MCP_RESOURCE_URL,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["templates:read"],
    })
  })

  it("challenges unauthenticated MCP requests with the public metadata URL", async () => {
    const response = await api.request(canonicalPath, { method: "POST" })

    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${resourceUrl.origin}${metadataPath}"`
    )
  })

  it("allows browser discovery requests and rejects the doubled endpoint path", async () => {
    const origin = "https://deessejs.com"
    const metadata = await api.request(apiMetadataPath, {
      headers: { Origin: origin },
    })
    const preflight = await api.request(apiMetadataPath, {
      method: "OPTIONS",
      headers: {
        Origin: origin,
        "Access-Control-Request-Method": "GET",
      },
    })
    const doubled = await api.request(
      `${API_BASE_PATH}${canonicalPath}`,
      { method: "POST" }
    )

    expect(metadata.headers.get("access-control-allow-origin")).toBe(origin)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin)
    expect(preflight.headers.get("access-control-allow-methods")).toContain("GET")
    expect(doubled.status).toBe(404)
  })
})
