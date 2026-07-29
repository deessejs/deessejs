import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import * as schema from "./schema/index.js"

// Serverless-friendly defaults:
//   prepare: false  → required behind PgBouncer / Neon pooler (extended-query
//                     protocol incompatible with transaction-mode pooling).
//   max: 10         → cap per Lambda/worker. Tune to provider limits.
//   idle_timeout: 60 → Neon serverless compute suspends after 5 min inactivity.
//                    20 s was too aggressive; ECONNRESET from the pooler killed connections.
//   max_lifetime: 1800 → recycle connections every 30 min to stay fresh.
//
// Lazy initialization: the pool is only created when `db` is first accessed.
// When DATABASE_URL is not set (e.g. `pnpm auth:generate`), a dummy object is
// returned so imports succeed without crashing.

let _db: ReturnType<typeof drizzle> | null = null

function getDb(): ReturnType<typeof drizzle> {
  if (!_db) {
    // Dynamic import to avoid ESM circular dependency issues while still
    // loading env vars at runtime (not build time).
    // This is allowed for @workspace/env/server in eslint-config.
    const envModule = require("@workspace/env/server") as {
      serverEnv: { DATABASE_URL: string | undefined }
    }
    const url = envModule.serverEnv.DATABASE_URL

    if (!url) {
      // CLI context: return a passthrough object so imports don't crash.
      // Real usage always has DATABASE_URL set.
      _db = {} as ReturnType<typeof drizzle>
    } else {
      const pool = postgres(url, {
        prepare: false,
        max: 10,
        idle_timeout: 60,
        max_lifetime: 60 * 30,
      })
      _db = drizzle(pool, { schema })
    }
  }
  return _db
}

// Accessor — consumers use `db`, never `_db`. The Proxy defers pool creation
// until a property is actually accessed (e.g. by drizzle queries at runtime).
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  },
})
