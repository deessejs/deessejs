import { createMcpProtectedRequestHandler } from "@better-auth/mcp"
import { call } from "@orpc/server"
import {
  createDpopReplayStore,
  createInsufficientScopeError,
} from "better-auth/oauth2"
import { HTTPException } from "hono/http-exception"
import { auth } from "@workspace/auth"
import { resolveMcpUserId } from "../../core/mcp/identity.js"
import {
  createProductMcpHandler,
  PRODUCT_MCP_TOOL_POLICIES,
} from "@workspace/mcp"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
import { API_BASE_PATH, API_AUTH_PATH } from "../../constants/base-path.js"
import { appRouter } from "../../orpc/index.js"
import type { ApiEnv } from "../env.js"

interface VerifiedMcpClaims {
  sub?: unknown
  scope?: unknown
}

interface McpIdentity {
  userId: string | null
  scopes: string[]
}

type JsonObject = Record<string, unknown>

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value)

function mapVerifiedMcpClaimsToIdentity(
  claims: VerifiedMcpClaims
): McpIdentity {
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

async function assertMcpToolScope(
  request: Request,
  identity: McpIdentity
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

  const toolPolicy = Object.values(PRODUCT_MCP_TOOL_POLICIES).find(
    (policy) => policy.name === params.name
  )
  if (!toolPolicy) {
    throw new HTTPException(403, {
      message: "MCP tool call has no registered scope policy.",
    })
  }

  if (!identity.scopes.includes(toolPolicy.scope)) {
    throw createInsufficientScopeError([toolPolicy.scope])
  }
}

const resource = serverEnv.MCP_RESOURCE_URL
const createHandler = (identity: { userId: string | null; scopes: string[] }) =>
  createProductMcpHandler({
    listTemplates: () =>
      call(appRouter.templates.list, undefined, {
        context: {
          headers: new Headers(),
          user: null,
          session: null,
          requestId: crypto.randomUUID(),
        },
      }),
    listMyOrganizations: () =>
      call(appRouter.organization.listMine, undefined, {
        context: {
          headers: new Headers(),
          user: null,
          session: null,
          requestId: crypto.randomUUID(),
          mcpIdentity: identity,
        },
      }),
    listOrganizationProjects: (input) =>
      call(
        appRouter.githubApp.projects.list,
        {
          slug: input.organizationSlug,
          page: input.page,
          pageSize: input.pageSize,
        },
        {
          context: {
            headers: new Headers(),
            user: null,
            session: null,
            requestId: crypto.randomUUID(),
            mcpIdentity: identity,
          },
        }
      ),
    getOrganizationProject: (input) =>
      call(
        appRouter.githubApp.projects.get,
        { slug: input.organizationSlug, projectId: input.projectId },
        {
          context: {
            headers: new Headers(),
            user: null,
            session: null,
            requestId: crypto.randomUUID(),
            mcpIdentity: identity,
          },
        }
      ),
    listOrganizationTemplates: (input) =>
      call(
        appRouter.organization.templates.list,
        {
          organizationSlug: input.organizationSlug,
          page: input.page,
          pageSize: input.pageSize,
        },
        {
          context: {
            headers: new Headers(),
            user: null,
            session: null,
            requestId: crypto.randomUUID(),
            mcpIdentity: identity,
          },
        }
      ),
    getOrganizationTemplate: (input) =>
      call(
        appRouter.organization.templates.get,
        {
          organizationSlug: input.organizationSlug,
          templateId: input.templateId,
        },
        {
          context: {
            headers: new Headers(),
            user: null,
            session: null,
            requestId: crypto.randomUUID(),
            mcpIdentity: identity,
          },
        }
      ),
  })

const authIssuer = `${serverEnv.API_BASE_URL}${API_AUTH_PATH}`
const protectedHandler = auth.$context.then((authContext) =>
  createMcpProtectedRequestHandler(
    {
      issuer: authIssuer,
      audience: resource,
      jwksUrl: `${authIssuer}/jwks`,
      jwtVerifyOptions: { typ: "at+jwt", requiredClaims: ["azp"] },
      challengeScopes: [
        "templates:read",
        "organizations:read",
        "organizations:projects:read",
        "organizations:templates:read",
      ],
      dpop: { replayStore: createDpopReplayStore(authContext) },
    },
    async (request, accessTokenClaims) => {
      const tokenIdentity = mapVerifiedMcpClaimsToIdentity(accessTokenClaims)
      const identity = {
        ...tokenIdentity,
        userId: await resolveMcpUserId(tokenIdentity.userId),
      }
      await assertMcpToolScope(request, identity)
      return createHandler(identity).fetch(request)
    }
  )
)

export const mountMcpRoutes = (api: Hono<ApiEnv>): void => {
  const resourceUrl = new URL(resource)
  const path = resourceUrl.pathname.slice(API_BASE_PATH.length)
  const metadataPrefix = "/.well-known/oauth-protected-resource"

  api.get(`${metadataPrefix}/*`, (c) => {
    if (
      c.req.path !== `${API_BASE_PATH}${metadataPrefix}${resourceUrl.pathname}`
    )
      return c.notFound()

    return c.json({
      resource,
      authorization_servers: [authIssuer],
      bearer_methods_supported: ["header"],
      scopes_supported: [
        "templates:read",
        "organizations:read",
        "organizations:projects:read",
        "organizations:templates:read",
      ],
    })
  })

  api.post(path, async (c) => (await protectedHandler)(c.req.raw))
}
