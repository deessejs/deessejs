import { describe, expect, it } from "vitest"
import { api } from "../../src/index.js"
import { API_BASE_PATH } from "../../src/constants/base-path.js"
import { serverEnv } from "@workspace/env/server"
import { createProductMcpHandler } from "@workspace/mcp"

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

  it("returns a protocol-valid result for list_templates", async () => {
    const handler = createProductMcpHandler({
      listTemplates: async () => ({
        templates: [],
      }),
    })
    const response = await handler.fetch(
      new Request("https://app.deessejs.com/api/v1/mcp", {
        method: "POST",
        headers: {
          "content-type": "application/json",
          accept: "application/json",
          "mcp-protocol-version": "2026-07-28",
          "mcp-method": "tools/call",
          "mcp-name": "list_templates",
        },
        body: JSON.stringify({
          jsonrpc: "2.0",
          id: 1,
          method: "tools/call",
          params: {
            name: "list_templates",
            arguments: {},
            _meta: {
              "io.modelcontextprotocol/protocolVersion": "2026-07-28",
              "io.modelcontextprotocol/clientCapabilities": {},
              "io.modelcontextprotocol/clientInfo": {
                name: "DeesseJS MCP regression test",
                version: "1.0.0",
              },
            },
          },
        }),
      })
    )

    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body).toMatchObject({
      jsonrpc: "2.0",
      id: 1,
      result: {
        resultType: "complete",
        content: [
          {
            type: "text",
            text: JSON.stringify({ templates: [] }),
          },
        ],
      },
    })
    expect(body.result).not.toHaveProperty("error")
  })
})
