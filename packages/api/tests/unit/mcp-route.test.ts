import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createSign, generateKeyPairSync } from "node:crypto"
import { createServer } from "node:http"
import { call } from "@orpc/server"
import {
  Client,
  StreamableHTTPClientTransport,
} from "@modelcontextprotocol/client"
import { createMcpProtectedRequestHandler } from "@better-auth/mcp"
import {
  createProductMcpHandler,
  PRODUCT_MCP_TOOL_POLICIES,
} from "@workspace/mcp"
import { serverEnv } from "@workspace/env/server"
import { api } from "../../src/index.js"
import { API_BASE_PATH } from "../../src/constants/base-path.js"
import { appRouter } from "../../src/orpc/index.js"
import { assertMcpToolScope } from "../../src/http/routes/mcp-tool-scope.js"
import { mapVerifiedMcpClaimsToIdentity } from "../../src/http/routes/mcp-identity.js"

describe("MCP HTTP route", () => {
  const resourceUrl = new URL(serverEnv.MCP_RESOURCE_URL)
  const canonicalPath = resourceUrl.pathname
  const metadataPath = `/.well-known/oauth-protected-resource${canonicalPath}`
  const apiMetadataPath = `${API_BASE_PATH}${metadataPath}`
  const issuer = `${serverEnv.API_BASE_URL}${API_BASE_PATH}/auth`
  const testIssuer = "https://auth.example.test"
  const testResource = "https://app.example.test/mcp"
  const { privateKey, publicKey } = generateKeyPairSync("rsa", {
    modulusLength: 2048,
  })
  const jwk = { ...publicKey.export({ format: "jwk" }), kid: "mcp-test-key" }
  const jwksServer = createServer((_request, response) => {
    response.setHeader("content-type", "application/json")
    response.end(JSON.stringify({ keys: [jwk] }))
  })
  let jwksUrl = ""

  const signAccessToken = (scope: string) => {
    const encode = (value: unknown) =>
      Buffer.from(JSON.stringify(value)).toString("base64url")
    const header = encode({ alg: "RS256", kid: "mcp-test-key", typ: "at+jwt" })
    const payload = encode({
      iss: testIssuer,
      aud: testResource,
      sub: "verified-user",
      azp: "test-client",
      scope,
      iat: Math.floor(Date.now() / 1000),
      exp: Math.floor(Date.now() / 1000) + 60,
    })
    const signingInput = `${header}.${payload}`
    const signer = createSign("RSA-SHA256")
    signer.update(signingInput)
    signer.end()
    return `${signingInput}.${signer.sign(privateKey, "base64url")}`
  }

  const protectedToolHandler = () =>
    createMcpProtectedRequestHandler(
      {
        issuer: testIssuer,
        audience: testResource,
        jwksUrl,
        jwtVerifyOptions: { typ: "at+jwt", requiredClaims: ["azp"] },
        challengeScopes: ["templates:read", "organizations:read"],
      },
      async (request, claims) => {
        await assertMcpToolScope(
          request,
          mapVerifiedMcpClaimsToIdentity(claims)
        )
        return new Response("tool called")
      }
    )

  const protectedToolRequest = (token: string, toolName: string) =>
    new Request(testResource, {
      method: "POST",
      headers: {
        authorization: `Bearer ${token}`,
        "content-type": "application/json",
      },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 1,
        method: "tools/call",
        params: { name: toolName, arguments: {} },
      }),
    })

  beforeAll(async () => {
    await new Promise<void>((resolve) =>
      jwksServer.listen(0, "127.0.0.1", resolve)
    )
    const address = jwksServer.address()
    if (!address || typeof address === "string")
      throw new Error("Missing JWKS address")
    jwksUrl = `http://127.0.0.1:${address.port}/jwks`
  })

  afterAll(async () => {
    await new Promise<void>((resolve, reject) =>
      jwksServer.close((error) => (error ? reject(error) : resolve()))
    )
  })

  it("serves RFC 9728 metadata with the supported read scopes", async () => {
    const response = await api.request(apiMetadataPath)

    expect(response.status).toBe(200)
    expect(response.headers.get("content-type")).toContain("application/json")
    await expect(response.json()).resolves.toEqual({
      resource: serverEnv.MCP_RESOURCE_URL,
      authorization_servers: [issuer],
      bearer_methods_supported: ["header"],
      scopes_supported: ["templates:read", "organizations:read"],
    })
  })

  it("challenges unauthenticated MCP requests with the public metadata URL", async () => {
    const response = await api.request(canonicalPath, { method: "POST" })

    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${resourceUrl.origin}${metadataPath}"`
    )
    expect(response.headers.get("www-authenticate")).toContain(
      'scope="templates:read organizations:read"'
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
    const doubled = await api.request(`${API_BASE_PATH}${canonicalPath}`, {
      method: "POST",
    })

    expect(metadata.headers.get("access-control-allow-origin")).toBe(origin)
    expect(preflight.status).toBe(204)
    expect(preflight.headers.get("access-control-allow-origin")).toBe(origin)
    expect(preflight.headers.get("access-control-allow-methods")).toContain(
      "GET"
    )
    expect(doubled.status).toBe(404)
  })

  it("negotiates the protocol, discovers tools, and calls both mocked operations", async () => {
    const templates = { templates: [] }
    const organizations = {
      organizations: [
        {
          id: "org-1",
          name: "Acme",
          slug: "acme",
          logo: null,
          role: "owner",
        },
      ],
    }
    const listTemplates = vi.fn(async () => templates)
    const listMyOrganizations = vi.fn(async () => organizations)
    const handler = createProductMcpHandler({
      listTemplates,
      listMyOrganizations,
    })
    const transport = new StreamableHTTPClientTransport(
      new URL("http://test.local/mcp"),
      { fetch: (url, init) => handler.fetch(new Request(url, init)) }
    )
    const client = new Client(
      { name: "DeesseJS protocol test", version: "1.0.0" },
      { versionNegotiation: { mode: "auto" } }
    )

    try {
      await client.connect(transport)

      expect(client.getProtocolEra()).toBe("modern")
      const discovery = await client.listTools()
      const registeredToolNames = discovery.tools.map((tool) => tool.name)
      const policyToolNames = Object.values(PRODUCT_MCP_TOOL_POLICIES).map(
        (policy) => policy.name
      )
      expect(registeredToolNames.sort()).toEqual([
        "list_my_organizations",
        "list_templates",
      ])
      expect([...registeredToolNames].sort()).toEqual(policyToolNames.sort())
      expect(
        Object.values(PRODUCT_MCP_TOOL_POLICIES).every(
          (policy) => policy.scope.length > 0
        )
      ).toBe(true)

      const templateResult = await client.callTool({
        name: "list_templates",
        arguments: {},
      })
      const organizationResult = await client.callTool({
        name: "list_my_organizations",
        arguments: {},
      })

      expect(templateResult.content).toEqual([
        { type: "text", text: JSON.stringify(templates) },
      ])
      expect(organizationResult.content).toEqual([
        { type: "text", text: JSON.stringify(organizations) },
      ])
      expect(listTemplates).toHaveBeenCalledOnce()
      expect(listMyOrganizations).toHaveBeenCalledOnce()
    } finally {
      await Promise.all([client.close(), handler.close()])
    }
  })

  it("denies organization reads without organizations:read at call time", async () => {
    await expect(
      call(appRouter.organization.listMine, undefined, {
        context: {
          headers: new Headers(),
          user: null,
          session: null,
          requestId: "mcp-scope-test",
          mcpIdentity: { userId: "verified-user", scopes: ["templates:read"] },
        },
      })
    ).rejects.toMatchObject({ code: "FORBIDDEN" })
  })

  it("fails closed when a tool call has no registered scope policy", async () => {
    const request = new Request(testResource, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        jsonrpc: "2.0",
        id: 5,
        method: "tools/call",
        params: { name: "future_tool", arguments: {} },
      }),
    })

    await expect(
      assertMcpToolScope(request, {
        userId: "verified-user",
        scopes: ["templates:read", "organizations:read"],
      })
    ).rejects.toMatchObject({ status: 403 })
  })

  it("enforces each tool scope through Better Auth and returns a scope challenge", async () => {
    const templatesToken = signAccessToken("templates:read")
    const templatesHandler = protectedToolHandler()
    const templateResponse = await templatesHandler(
      protectedToolRequest(templatesToken, "list_templates")
    )
    const deniedOrganizations = await templatesHandler(
      protectedToolRequest(templatesToken, "list_my_organizations")
    )
    const deniedChallenge = deniedOrganizations.headers.get("www-authenticate")

    expect(templateResponse.status).toBe(200)
    expect(deniedOrganizations.status).toBe(403)
    expect(deniedChallenge).toContain('error="insufficient_scope"')
    expect(deniedChallenge).toContain('scope="organizations:read"')
  })

  it("allows organizations-only tokens to call the organization tool", async () => {
    const handler = protectedToolHandler()
    const response = await handler(
      protectedToolRequest(
        signAccessToken("organizations:read"),
        "list_my_organizations"
      )
    )

    expect(response.status).toBe(200)
    await expect(response.text()).resolves.toBe("tool called")
  })

  it("allows tokens with both tool scopes to call either tool", async () => {
    const handler = protectedToolHandler()
    const token = signAccessToken("templates:read organizations:read")
    const templatesResponse = await handler(
      protectedToolRequest(token, "list_templates")
    )
    const organizationsResponse = await handler(
      protectedToolRequest(token, "list_my_organizations")
    )

    expect(templatesResponse.status).toBe(200)
    expect(organizationsResponse.status).toBe(200)
  })
})
