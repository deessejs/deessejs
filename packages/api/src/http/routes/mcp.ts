import { McpServer, createMcpHandler } from "@modelcontextprotocol/server"
import { requireMcpAuth } from "@better-auth/mcp"
import { call } from "@orpc/server"
import { auth } from "@workspace/auth"
import { serverEnv } from "@workspace/env/server"
import type { Hono } from "hono"
import { appRouter } from "../../orpc/index.js"
import type { ApiEnv } from "../env.js"
import { z } from "zod"

const resource = serverEnv.MCP_RESOURCE_URL
const mcpHandler = createMcpHandler(() => {
  const server = new McpServer({ name: "DeesseJS", version: "1.0.0" })
  server.registerTool(
    "list_templates",
    {
      description: "List public DeesseJS product templates.",
      inputSchema: z.object({}),
    },
    async () => {
      const result = await call(appRouter.templates.list, undefined, {
        context: {
          headers: new Headers(),
          user: null,
          session: null,
          requestId: crypto.randomUUID(),
        },
      })
      return {
        resultType: "content",
        content: [{ type: "text", text: JSON.stringify(result) }],
      }
    }
  )
  return server
}, { legacy: "reject" })

const protectedHandler = requireMcpAuth(
  auth,
  (request) => mcpHandler.fetch(request),
  { resource, requiredScopes: ["templates:read"] }
)

export const mountMcpRoutes = (api: Hono<ApiEnv>): void => {
  const path = new URL(resource).pathname
  api.post(path, async (c) => protectedHandler(c.req.raw))
}
