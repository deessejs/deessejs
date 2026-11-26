import { afterAll, beforeAll, describe, expect, it, vi } from "vitest"
import { createSign, generateKeyPairSync } from "node:crypto"
import { createServer } from "node:http"
import { call } from "@orpc/server"
import { createInsufficientScopeError } from "better-auth/oauth2"
import { HTTPException } from "hono/http-exception"
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

const mapTestClaimsToIdentity = (claims: {
  sub?: unknown
  scope?: unknown
}) => {
  const subject = claims.sub
  const scopeClaim = claims.scope
  let userId: string | null = null
  let scopes: string[] = []

  if (typeof subject === "string" && subject.length > 0) userId = subject
  if (typeof scopeClaim === "string") {
    scopes = scopeClaim.split(/\s+/).filter(Boolean)
  }

  return { userId, scopes }
}

const isJsonObject = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value)

async function assertTestToolScope(
  request: Request,
  identity: ReturnType<typeof mapTestClaimsToIdentity>
): Promise<void> {
  let payload: unknown
  try {
    payload = await request.clone().json()
  } catch {
    return
  }

  if (!isJsonObject(payload) || payload.method !== "tools/call") return
  const params = payload.params
  if (!isJsonObject(params) || typeof params.name !== "string") {
    throw new HTTPException(403, {
      message: "MCP tool call has no registered scope policy.",
    })
  }

  const policy = Object.values(PRODUCT_MCP_TOOL_POLICIES).find(
    (candidate) => candidate.name === params.name
  )
  if (!policy) {
    throw new HTTPException(403, {
      message: "MCP tool call has no registered scope policy.",
    })
  }
  if (!identity.scopes.includes(policy.scope)) {
    throw createInsufficientScopeError([policy.scope])
  }
}

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
        const identity = mapTestClaimsToIdentity(claims)
        await assertTestToolScope(request, identity)
        return new Response(JSON.stringify(identity))
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
      scopes_supported: [
        "templates:read",
        "organizations:read",
        "organizations:projects:read",
        "organizations:templates:read",
      ],
    })
  })

  it("challenges unauthenticated MCP requests with the public metadata URL", async () => {
    const response = await api.request(canonicalPath, { method: "POST" })

    expect(response.status).toBe(401)
    expect(response.headers.get("www-authenticate")).toContain(
      `resource_metadata="${resourceUrl.origin}${metadataPath}"`
    )
    expect(response.headers.get("www-authenticate")).toContain(
      'scope="templates:read organizations:read organizations:projects:read organizations:templates:read"'
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
    const projects = {
      projects: [],
      pagination: { page: 1, pageSize: 25, hasMore: false },
    }
    const project = { project: { id: "project-1" } }
    const organizationTemplates = {
      templates: [],
      pagination: { page: 1, pageSize: 25, hasMore: false },
    }
    const organizationTemplate = { template: { id: "template-1" } }
    const listOrganizationProjects = vi.fn(async () => projects)
    const getOrganizationProject = vi.fn(async () => project)
    const listOrganizationTemplates = vi.fn(async () => organizationTemplates)
    const getOrganizationTemplate = vi.fn(async () => organizationTemplate)
    const handler = createProductMcpHandler({
      listTemplates,
      listMyOrganizations,
      listOrganizationProjects,
      getOrganizationProject,
      listOrganizationTemplates,
      getOrganizationTemplate,
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
      expect([...registeredToolNames].sort()).toEqual([
        "get_organization_project",
        "get_organization_template",
        "list_my_organizations",
        "list_organization_projects",
        "list_organization_templates",
        "list_templates",
      ])
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
      const projectsResult = await client.callTool({
        name: "list_organization_projects",
        arguments: { organization_slug: "acme", page: 2, page_size: 10 },
      })
      const projectResult = await client.callTool({
        name: "get_organization_project",
        arguments: {
          organization_slug: "acme",
          project_id: "00000000-0000-4000-8000-000000000001",
        },
      })
      const organizationTemplatesResult = await client.callTool({
        name: "list_organization_templates",
        arguments: { organization_slug: "acme", page: 1, page_size: 5 },
      })
      const organizationTemplateResult = await client.callTool({
        name: "get_organization_template",
        arguments: {
          organization_slug: "acme",
          template_id: "00000000-0000-4000-8000-000000000002",
        },
      })

      expect(templateResult.content).toEqual([
        { type: "text", text: JSON.stringify(templates) },
      ])
      expect(organizationResult.content).toEqual([
        { type: "text", text: JSON.stringify(organizations) },
      ])
      expect(projectsResult.content).toEqual([
        { type: "text", text: JSON.stringify(projects) },
      ])
      expect(projectResult.content).toEqual([
        { type: "text", text: JSON.stringify(project) },
      ])
      expect(organizationTemplatesResult.content).toEqual([
        { type: "text", text: JSON.stringify(organizationTemplates) },
      ])
      expect(organizationTemplateResult.content).toEqual([
        { type: "text", text: JSON.stringify(organizationTemplate) },
      ])
      expect(listTemplates).toHaveBeenCalledOnce()
      expect(listMyOrganizations).toHaveBeenCalledOnce()
      expect(listOrganizationProjects).toHaveBeenCalledWith({
        organizationSlug: "acme",
        page: 2,
        pageSize: 10,
      })
      expect(getOrganizationProject).toHaveBeenCalledWith({
        organizationSlug: "acme",
        projectId: "00000000-0000-4000-8000-000000000001",
      })
      expect(listOrganizationTemplates).toHaveBeenCalledWith({
        organizationSlug: "acme",
        page: 1,
        pageSize: 5,
      })
      expect(getOrganizationTemplate).toHaveBeenCalledWith({
        organizationSlug: "acme",
        templateId: "00000000-0000-4000-8000-000000000002",
      })
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
      assertTestToolScope(request, {
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
    await expect(templateResponse.json()).resolves.toMatchObject({
      userId: "verified-user",
      scopes: ["templates:read"],
    })
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
    await expect(response.json()).resolves.toMatchObject({
      userId: "verified-user",
      scopes: ["organizations:read"],
    })
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

  it("enforces the organization project and template scopes per tool", async () => {
    const handler = protectedToolHandler()
    const deniedProject = await handler(
      protectedToolRequest(
        signAccessToken("organizations:templates:read"),
        "list_organization_projects"
      )
    )
    const deniedTemplate = await handler(
      protectedToolRequest(
        signAccessToken("organizations:projects:read"),
        "list_organization_templates"
      )
    )
    const allowedProject = await handler(
      protectedToolRequest(
        signAccessToken("organizations:projects:read"),
        "get_organization_project"
      )
    )
    const allowedTemplate = await handler(
      protectedToolRequest(
        signAccessToken("organizations:templates:read"),
        "get_organization_template"
      )
    )

    expect(deniedProject.status).toBe(403)
    expect(deniedProject.headers.get("www-authenticate")).toContain(
      'scope="organizations:projects:read"'
    )
    expect(deniedTemplate.status).toBe(403)
    expect(deniedTemplate.headers.get("www-authenticate")).toContain(
      'scope="organizations:templates:read"'
    )
    expect(allowedProject.status).toBe(200)
    expect(allowedTemplate.status).toBe(200)
  })
})
