import { createMcpProtectedRequestHandler } from "@better-auth/mcp"
import { call } from "@orpc/server"
import { createDpopReplayStore } from "better-auth/oauth2"
import { auth } from "@workspace/auth"
import { createProductMcpHandler } from "@workspace/mcp"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
import { API_BASE_PATH, API_AUTH_PATH } from "../../constants/base-path.js"
import { appRouter } from "../../orpc/index.js"
import type { ApiEnv } from "../env.js"

const resource = serverEnv.MCP_RESOURCE_URL
const mcpHandler = createProductMcpHandler({
  listTemplates: () =>
    call(appRouter.templates.list, undefined, {
      context: {
        headers: new Headers(),
        user: null,
        session: null,
        requestId: crypto.randomUUID(),
      },
    }),
})

const authIssuer = `${serverEnv.API_BASE_URL}${API_AUTH_PATH}`
const protectedHandler = auth.$context.then((authContext) =>
  createMcpProtectedRequestHandler(
    {
      issuer: authIssuer,
      audience: resource,
      jwksUrl: `${authIssuer}/jwks`,
      jwtVerifyOptions: { typ: "at+jwt", requiredClaims: ["azp"] },
      requiredScopes: ["templates:read"],
      dpop: { replayStore: createDpopReplayStore(authContext) },
    },
    (request) => mcpHandler.fetch(request)
  )
)

export const mountMcpRoutes = (api: Hono<ApiEnv>): void => {
  const path = new URL(resource).pathname.slice(API_BASE_PATH.length)
  api.post(path, async (c) => (await protectedHandler)(c.req.raw))
}
