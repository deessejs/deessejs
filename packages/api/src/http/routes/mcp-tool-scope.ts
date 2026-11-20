import { createInsufficientScopeError } from "better-auth/oauth2"
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

  const toolName = params.name
  let requiredScope: string | null = null
  if (toolName === "list_templates") requiredScope = "templates:read"
  if (toolName === "list_my_organizations") requiredScope = "organizations:read"

  if (requiredScope && !identity.scopes.includes(requiredScope)) {
    throw createInsufficientScopeError([requiredScope])
  }
}
