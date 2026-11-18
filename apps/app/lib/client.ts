"use client"

import { authClient } from "./auth-client"
import { orpcBrowser } from "./orpc-browser"

/**
 * Browser client facade. Auth operations retain Better Auth's client,
 * plugins, hooks, and transport; application procedures retain oRPC.
 */
export const client = {
  auth: authClient,
  rpc: orpcBrowser,
}
