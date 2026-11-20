import { createInsufficientScopeError } from "better-auth/oauth2"
import { HTTPException } from "hono/http-exception"
import { PRODUCT_MCP_TOOL_POLICIES } from "@workspace/mcp"
import type { McpIdentity } from "./mcp-identity.js"

type JsonObject = Record<string, unknown>

const isJsonObject = (value: unknown): value is JsonObject =>
  typeof value === "object" && value !== null && !Array.isArray(value)

/** Raise Better Auth's OAuth scope error for a tool call the token cannot make. */
export async function assertMcpToolScope(
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
  if (!isJsonObject(params)) return

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
