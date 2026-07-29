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
export const GET = handle(api)
export const POST = handle(api)