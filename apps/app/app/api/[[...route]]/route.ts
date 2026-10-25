import { handle } from "hono/vercel"
import { api } from "@workspace/api"

// Without this, Next.js attempts build-time page-data collection which fails
// because the route module imports @workspace/database → reads DATABASE_URL
// at module load. force-dynamic defers evaluation to request time.
//
// Caveat (Next.js ≥14.2.0): this directive does NOT disable the Data Cache
// for fetch() calls — use `cache: 'no-store'` or wrap in `use cache` if a
// procedure inside this route uses fetch() and must always refetch.
//
// Caveat (Next.js ≥16 with cacheComponents): this directive is REMOVED when
// cacheComponents: true. The replacement is implicit dynamic rendering plus
// an explicit <Suspense> boundary (or `use cache`) around runtime access.
// Track for removal as part of cacheComponents migration.
export const dynamic = "force-dynamic"

// Catch-all → Hono (per https://hono.dev/docs/getting-started/nextjs).
// `handle(api)` from hono/vercel replaces the previous manual dispatch on
// request.url substrings (/auth/, /rpc/) — that reimplementation duplicated
// route knowledge and required `as any` casts on the Next.js exports.
//
// The `/auth/*` subtree mounted by `packages/api/src/http/routes/http.ts:57`
// delegates to the Better Auth handler. Since
// `packages/auth/src/auth.ts` now configures `baseURL` as a dynamic
// `{ allowedHosts, protocol, fallback }` form (the apex + wildcards
// allowlist lives in `packages/auth/src/host-allowlist.ts`, the shared
// allowlist with Hono CORS). Per-request origin resolution is handled
// inside the auth handler itself, so no changes are needed in this
// catch-all.
export const GET = handle(api)
export const POST = handle(api)

// Next.js auto-implements OPTIONS for a route handler that does not
// export one. The auto-implementation answers 204 with an `Allow`
// header and no CORS headers, and it runs before the request reaches
// the Hono app, so the CORS middleware never sees the preflight. The
// browser then blocks every cross-origin request with a
// non-simple content type, and the POST never leaves the page.
//
// Exporting OPTIONS hands the preflight to Hono, whose CORS
// middleware answers it with `Access-Control-Allow-Origin` and the
// requested headers.
export const OPTIONS = handle(api)
