import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

import { APP_URL } from "@/lib/app-config"

// `API_RPC_PATH` is the single source of truth for the oRPC endpoint URL
// (defined in @workspace/api/base-path). The catch-all Hono mount at
// `apps/app/app/api/[[...route]]/route.ts` reads the same constant via
// Hono's `basePath(API_BASE_PATH)`. Renaming the API prefix means editing
// the constant and moving the Next.js catch-all directory; nothing else.
//
// The router is imported from `@workspace/api/router` (subpath) and the
// path from `@workspace/api/base-path` (subpath) — *not* the main barrel.
// Importing from `@workspace/api` would also drag `@workspace/auth` →
// `@workspace/database` → `postgres` into the client bundle, which
// Turbopack cannot satisfy.
//
// The link URL is absolute, composed from `APP_URL` (the apps/app host,
// declared in `@workspace/env`) and `API_RPC_PATH`. ADR-021 documents the
// convention for cross-app URLs; here we apply the same shape
// (`new URL(path, base).toString()`) for the same-app, server-side case:
// RSC fetch needs an absolute URL to resolve, while a relative path
// (`url: API_RPC_PATH` alone) raises "Invalid URL" on the Node runtime.
// The apps/app host is `appURL()` (per ADR-021's table).
const link = new RPCLink({
  url: new URL(API_RPC_PATH, APP_URL).toString(),
})

// Type the client with the router
export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)
