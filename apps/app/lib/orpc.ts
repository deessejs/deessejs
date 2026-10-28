import "server-only"

import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"
import type { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"
import { headers as requestHeaders } from "next/headers"

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
// The router import is **type-only** for the same reason, one step
// further: `import type { appRouter }` keeps the router's runtime graph
// out of this module entirely, so the API's server-only dependencies can
// never travel into the app's client bundle through the client type.
//
// Server-side fetch needs an absolute URL. On Vercel, use the deployment
// host supplied at runtime so a custom environment never falls back to a
// build-time localhost or production URL. Local development uses APP_URL.
const appOrigin = process.env.VERCEL_URL
  ? `https://${process.env.VERCEL_URL}`
  : APP_URL

const link = new RPCLink({
  url: () => new URL(API_RPC_PATH, appOrigin).toString(),
  // The session travels in the cookie, so the cookie is what the link
  // forwards. Without it a server-side call reaches the API as an
  // anonymous request, and a procedure that reads the session sees no
  // caller.
  //
  // Only the cookie is forwarded. Forwarding the whole header set would
  // forward the `host` and `x-forwarded-host` headers too, and Better
  // Auth resolves its base URL from those. The link already points at an
  // absolute URL built from `APP_URL`, and the API's own allowlist is
  // what should decide, not a header the app chose to relay.
  headers: async () => {
    try {
      const h = await requestHeaders()
      return { cookie: h.get("cookie") ?? "" }
    } catch {
      // `headers()` reads the request's async storage and throws
      // outside a request scope. Outside a request there is no session
      // to forward, so the honest answer is "no cookie".
      return {}
    }
  },
})

// Type the client with the router
export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)
