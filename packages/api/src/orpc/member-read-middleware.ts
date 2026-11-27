import { ORPCError } from "@orpc/server"
import { base } from "./base.js"

/** Allows browser sessions or a verified MCP grant for a read operation. */
export const memberReadGuard = (scope: string) =>
  base.middleware(async ({ context, next }) => {
    if (context.user && context.session) {
      return next({ context: { ...context, actorUserId: context.user.id } })
    }

    const identity = context.mcpIdentity
    if (!identity?.userId) throw new ORPCError("UNAUTHORIZED")
    if (!identity.scopes.includes(scope)) throw new ORPCError("FORBIDDEN")

    return next({
      context: { ...context, actorUserId: identity.userId },
    })
  })
