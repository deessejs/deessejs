import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

/**
 * Typed oRPC client for the marketing site.
 *
 * `API_RPC_PATH` is the single source of truth for the oRPC endpoint
 * URL (defined in @workspace/api/base-path, source
 * packages/api/src/constants/base-path.ts). The same constant is read
 * by apps/app's lib/orpc.ts and by Hono's `basePath(API_BASE_PATH)`
 * server-side. Renaming the API prefix means editing the constant and
 * moving the Next.js catch-all directory; nothing else.
 *
 * The custom `fetch` hook threads Next.js App Router ISR directives
 * (`next.revalidate`, `next.tags`) onto the standard `fetch` `init`.
 * Next reads these directly from the `RequestInit` — there is no
 * abstraction layer between RPCLink and Next's data cache. The
 * directives are static across the site, so they live on the link
 * rather than on each call site.
 *
 * See docs/engineering/plans/orpc-client-migration.md phase 2 for the
 * rationale and the alternatives we rejected (oRPC `context`, ISR via
 * `unstable_cache`, server-side cache in @workspace/api).
 *
 * The router is imported from `@workspace/api/router` (subpath) and the
 * path from `@workspace/api/base-path` (subpath) — *not* the main barrel.
 * Importing from `@workspace/api` would also drag `@workspace/auth` →
 * `@workspace/database` → `postgres` into the client bundle, which
 * Turbopack cannot satisfy (node builtins `net`/`tls`/`perf_hooks`).
 */
const link = new RPCLink({
  url: API_RPC_PATH,
  fetch: (request, init) => {
    const isrInit: RequestInit = {
      ...init,
      next: {
        revalidate: 600,
        tags: ["templates"],
      },
    }
    return globalThis.fetch(request, isrInit)
  },
})

export type ORPCClient = RouterClient<typeof appRouter>

export const orpc: ORPCClient = createORPCClient(link)
