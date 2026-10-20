import { handle } from "hono/vercel"
import { api } from "@workspace/api"
import { installNextPostResponseScheduler } from "@/lib/organization-post-response"

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

// The `/auth/*` subtree of this catch-all is the only path by which an
// invitation is ever dispatched, and the dispatch is deliberately not
// awaited: awaiting SMTP would put the transport round trip on the
// latency of the invitation request. On Vercel a promise the response
// does not wait for can be reclaimed before it settles, which loses
// the email with no signal. `after()` is what tells the runtime the
// request is not finished yet.
//
// Installed at module load, before any request is handled. It has to
// live in `apps/app` rather than in `@workspace/auth`: `after()` is a
// Next.js API, and the CLI (the only other consumer of that package)
// does not depend on Next at all.
installNextPostResponseScheduler()

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
// allowlist with Hono CORS), so per-request origin resolution
// is handled inside the auth handler itself — no changes needed in this
// catch-all.
export const GET = handle(api)
export const POST = handle(api)