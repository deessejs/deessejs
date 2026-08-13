/**
 * API test setup
 *
 * Provides test helpers for Hono routes and oRPC procedures.
 */
import { auth } from "@workspace/auth/tests/setup.js"
import { appRouter } from "../src/router/index.js"
import { RPCHandler } from "@orpc/server/fetch"

export { auth }

// oRPC test handler
export function createRPCHandler() {
  return new RPCHandler(appRouter)
}
