import { requireMcpAuth } from "@better-auth/mcp"
import { call } from "@orpc/server"
import { auth } from "@workspace/auth"
import { createProductMcpHandler } from "@workspace/mcp"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
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

const protectedHandler = requireMcpAuth(
  auth,
  (request) => mcpHandler.fetch(request),
  { resource, requiredScopes: ["templates:read"] }
)

export const mountMcpRoutes = (api: Hono<ApiEnv>): void => {
  const path = new URL(resource).pathname
  api.post(path, async (c) => protectedHandler(c.req.raw))
}
