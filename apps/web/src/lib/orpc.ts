import "server-only"

import { createORPCClient } from "@orpc/client"
import { RPCLink } from "@orpc/client/fetch"
import type { RouterClient } from "@orpc/server"

// Type-only import: `appRouter` is referenced exclusively as `typeof
// appRouter` in the typed-client shape below. Tree-shaking the runtime
// value out keeps node-only modules transitively pulled by the API
// router (resend SDK, @workspace/env/server via dotenv loader,
// `node:crypto` in the rate-limit primitive) out of the
// marketing-site bundle. The previous value-level import worked
// for the existing routes because those routes pulled nothing
// node-only: the new `playbook` route does (it imports
// `@workspace/email`, which uses `node:crypto`-backed modules), so
// the import is now tightened to type-only.
import type { appRouter } from "@workspace/api/router"
import { API_RPC_PATH } from "@workspace/api/base-path"

import { apiBaseUrl } from "./preview-urls"

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
 * The module is server-only. A browser cannot call the API directly:
 * a preview deployment of the API is protected by Vercel, and Vercel
 * answers a CORS preflight with a redirect the browser cannot follow,
 * so the preflight fails and the POST never leaves the page. The
 * browser talks to a route handler on its own origin, and that
 * handler calls the API from the server. The `server-only` marker
 * makes the boundary a build error rather than a convention.
 *
 * `API_RPC_PATH` is the path part of the oRPC endpoint URL (defined
 * in @workspace/api/base-path, source
 * packages/api/src/constants/base-path.ts). The host part is the API
 * origin; together they form the full oRPC endpoint URL via
 * `new URL(API_RPC_PATH, origin)`.
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
 *
 *
 *   No `revalidateTag` purge route exists in this repo today; if one
 *   is added later, target `templates:live` for runtime content.
 *
 * The router is imported from `@workspace/api/router` (subpath) and the
 * path from `@workspace/api/base-path` (subpath) — *not* the main barrel.
 * Importing from `@workspace/api` would also drag `@workspace/auth` →
 * `@workspace/database` → `postgres` into the client bundle, which
 * Turbopack cannot satisfy (node builtins `net`/`tls`/`perf_hooks`).
 *
 * We re-type the inferred context with `FetchCacheOptions` so the
 * per-call `cache` shape is accepted by TypeScript while server-side
 * context fields remain available.
 */
export type ORPCClient = RouterClient<typeof appRouter, FetchCacheOptions>

/**
 * Build an oRPC client for one API origin.
 *
 * The origin is a parameter because the caller decides which
 * deployment it talks to: the default client below resolves the
 * preview origin of the `deessejs-app` project, and the signup proxy
 * resolves the same origin plus the headers Vercel's deployment
 * protection expects.
 */
export const createOrpcClient = (
  origin: string,
  config?: { headers?: Record<string, string> },
): ORPCClient => {
  const link = new RPCLink({
    // The oRPC endpoint URL is composed from the path constant
    // (single source of truth for the API prefix) and the host
    // constant (declared in @workspace/env, defaults to
    // localhost:3001 in dev, app.deessejs.com in prod). The previous
    // form `url: API_RPC_PATH` (a relative path) resolved against
    // the current domain and hit /api/v1 on deessejs.com, which
    // does not host the backend. `new URL(path, base)` is robust
    // to a trailing slash on either side: the leading slash on the
    // path erases the trailing slash on the base. The schema's
    // `.refine` rejects trailing slashes at parse time as a second
    // layer of defence.
    url: new URL(API_RPC_PATH, origin).toString(),
    fetch: (request, init, options) => {
      const isrInit = buildFetchIsrInit(init, options?.context?.cache)
      return globalThis.fetch(
        request,
        withExtraHeaders(request, isrInit, config?.headers),
      )
    },
  })

  return createORPCClient(link)
}

/**
 * Merge extra headers into a `fetch` init.
 *
 * The headers of the `Request` object and of the init are merged
 * first: `fetch` replaces the headers of the request with the ones in
 * the init, so passing only the extra headers would drop the content
 * type the oRPC client set on the request.
 */
const withExtraHeaders = (
  request: Request,
  init: RequestInit,
  extra: Record<string, string> | undefined,
): RequestInit => {
  if (!extra || Object.keys(extra).length === 0) return init

  const headers = new Headers(request.headers)
  for (const [name, value] of new Headers(init.headers).entries()) {
    headers.set(name, value)
  }
  for (const [name, value] of Object.entries(extra)) {
    headers.set(name, value)
  }
  return { ...init, headers }
}

/**
 * The client the server components use.
 *
 * Its origin is resolved at module load from the Vercel env vars, so
 * it points at the preview deployment of the API on a preview
 * deployment of the marketing site.
 */
export const orpc: ORPCClient = createOrpcClient(apiBaseUrl)

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
