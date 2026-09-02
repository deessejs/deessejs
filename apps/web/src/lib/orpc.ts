import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

import { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"
import { clientEnv } from "@workspace/env/client"

/**
 * Per-call context advertised by the marketing-site oRPC client.
 * Carries Next.js App Router ISR directives through to the
 * underlying `fetch` hook — the only place the directive can be
 * applied (see `https://orpc.dev/docs/client/rpc-link`,
 * `https://nextjs.org/docs/app/api-reference/functions/fetch`).
 *
 * Naming note: this is a **client-local** fetch hook option, NOT
 * the server-side `BaseContext` (`packages/api/src/orpc/base-context.ts`).
 * They are separate types with separate lifecycles. Renamed from
 * `MarketingCallContext` to `FetchCacheOptions` to make the
 * distinction self-documenting at call-sites.
 */
export type FetchCacheOptions = {
  cache?: { tag?: string; revalidate?: number }
}

/**
 * Apply Next.js ISR directives (`next.revalidate`, `next.tags`)
 * to a `RequestInit`, sourced from the per-call
 * `options.context.cache` shape.
 *
 * Pure function: same inputs → same outputs. Falls back to the
 * legacy site-wide default (`revalidate: 600`, tag `"templates"`)
 * when `cacheDirective` is missing, so a future call-site that
 * forgets to set context does not silently change cache
 * semantics — exactly the situation that produced the cache
 * poisoning in issue #81.
 *
 * Exported so a colocated unit test can pin the translation
 * contract; not part of the call-site surface.
 */
export const buildFetchIsrInit = (
  init: RequestInit | undefined,
  cacheDirective: FetchCacheOptions["cache"],
): RequestInit => {
  const revalidate = cacheDirective?.revalidate ?? 600
  const tags = cacheDirective?.tag ? [cacheDirective.tag] : ["templates"]
  return {
    ...init,
    next: { revalidate, tags },
  }
}

/**
 * Typed oRPC client for the marketing site.
 *
 * `API_RPC_PATH` is the path part of the oRPC endpoint URL (defined
 * in @workspace/api/base-path, source
 * packages/api/src/constants/base-path.ts). The host part is
 * `clientEnv.NEXT_PUBLIC_API_BASE_URL` (declared in @workspace/env);
 * together they form the full oRPC endpoint URL via
 * `new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL)`.
 * The same path constant is read by apps/app's lib/orpc.ts and by
 * Hono's `basePath(API_BASE_PATH)` server-side. Renaming the API
 * prefix means editing the constant, updating the env var on Vercel,
 * and moving the Next.js catch-all directory; nothing else.
 *
 * Cache behavior (issue #81):
 *   `RPCLink` exposes per-call `context` to its `fetch` hook. We use
 *   that hook to thread Next.js App Router ISR directives
 *   (`next.revalidate`, `next.tags`) onto the standard `fetch` `init`,
 *   with two distinct shapes keyed by tag:
 *
 *     - `templates:live` (revalidate: 0) — used by live runtime RSCs
 *       (the index page, the detail page, and on-demand metadata).
 *       revalidate=0 keeps the data cache fresh on each request, so a
 *       transient failure does NOT pin a poisoned `{ templates: [] }`
 *       body for ten minutes. The error propagates to the segment's
 *       `error.tsx` boundary instead.
 *
 *     - `templates:static` (revalidate: 600) — used only by
 *       `generateStaticParams`. The slug list survives across builds
 *       and a transient failure at build time is recovered locally
 *       (the call-site returns `[]` so the build still ships; runtime
 *       on-demand rendering covers the missing slugs).
 *
 *   Call-sites opt in by passing a per-call context with a `cache`
 *   shape (`{ tag: string, revalidate: number }`). Without context,
 *   we fall back to the legacy site-wide behavior (`revalidate: 600`,
 *   tag `"templates"`) so a future call-site that forgets to set
 *   context does not silently change cache semantics.
 *
 *   We previously rejected per-call context in favor of a site-wide
 *   tag. Issue #81 proved that approach unsafe: a single runtime error
 *   cached `{ templates: [] }` under the site-wide tag and pinned the
 *   empty-state for ten minutes. See
 *   docs/engineering/plans/orpc-client-migration.md for history.
 *
 *   No `revalidateTag` purge route exists in this repo today; if one
 *   is added later, target `templates:live` for runtime content.
 *
 * The router is imported from `@workspace/api/router` (subpath) and the
 * path from `@workspace/api/base-path` (subpath) — *not* the main barrel.
 * Importing from `@workspace/api` would also drag `@workspace/auth` →
 * `@workspace/database` → `postgres` into the client bundle, which
 * Turbopack cannot satisfy (node builtins `net`/`tls`/`perf_hooks`).
 */
const link = new RPCLink({
  // Per ADR-021: the oRPC endpoint URL is composed from the
  // path constant (single source of truth for the API prefix) and
  // the host constant (declared in @workspace/env, defaults to
  // localhost:3001 in dev, app.deessejs.com in prod). The previous
  // form `url: API_RPC_PATH` (a relative path) resolved against
  // the current domain and hit /api/v1 on deessejs.com, which
  // does not host the backend. `new URL(path, base)` is robust
  // to a trailing slash on either side: the leading slash on the
  // path erases the trailing slash on the base. The schema's
  // `.refine` rejects trailing slashes at parse time as a second
  // layer of defence.
  url: new URL(API_RPC_PATH, clientEnv.NEXT_PUBLIC_API_BASE_URL).toString(),
  fetch: (request, init, options) => {
    const isrInit = buildFetchIsrInit(init, options?.context?.cache)
    return globalThis.fetch(request, isrInit)
  },
})

/**
 * Typed oRPC client. We re-type the inferred context with
 * `FetchCacheOptions` so the per-call `cache` shape is accepted by
 * TypeScript while server-side context fields remain available.
 */
export type ORPCClient = RouterClient<typeof appRouter, FetchCacheOptions>

export const orpc: ORPCClient = createORPCClient(link)

/**
 * Tag a call as "live runtime, do not poison the cache on failure".
 * Pass as the second argument to any `orpc.*` call.
 */
export const liveCache = {
  context: { cache: { revalidate: 0, tag: "templates:live" } },
} as const

/**
 * Tag a call as "build-time static param collection, return empty
 * on failure so the build ships". Tag is namespaced to avoid
 * colliding with the live cache.
 */
export const staticParamsCache = {
  context: { cache: { revalidate: 600, tag: "templates:static" } },
} as const
