import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { appRouter, API_RPC_PATH } from "@workspace/api"

// `API_RPC_PATH` is the single source of truth for the oRPC endpoint URL
// (exported from the @workspace/api main entry, defined in
// packages/api/src/constants/base-path.ts). Both the Next.js catch-all
// at `apps/app/app/api/[[...route]]/route.ts` and Hono's
// `basePath(API_BASE_PATH)` read from the same constant. Renaming the
// API prefix means editing the constant and moving the Next.js
// catch-all directory; nothing else.
const link = new RPCLink({
  url: API_RPC_PATH,
})

// Type the client with the router
export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)