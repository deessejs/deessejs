import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

// `API_RPC_PATH` is the single source of truth for the oRPC endpoint URL
// (defined in @workspace/api/base-path). Both the Next.js catch-all at
// `apps/app/app/api/[[...route]]/route.ts` and Hono's `basePath(API_BASE_PATH)`
// read from the same constant — see packages/api/src/constants/base-path.ts
// for the full invariant. Renaming the API prefix means editing the constant
// and moving the Next.js catch-all directory; nothing else.
//
// The router is imported from `@workspace/api/router` (subpath) and the
// path from `@workspace/api/base-path` (subpath) — *not* the main barrel.
// Importing from `@workspace/api` would also drag `@workspace/auth` →
// `@workspace/database` → `postgres` into the client bundle, which
// Turbopack cannot satisfy.
const link = new RPCLink({
  url: API_RPC_PATH,
})

// Type the client with the router
export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)