import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { serverEnv } from "@workspace/env/server"

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
// `serverEnv` is itself a lazy Proxy in @workspace/env/server, so the static
// import below does not trigger env validation at module load — only the
// first property access (`serverEnv.DATABASE_URL`) does. A previous version
// used `require("@workspace/env/server")` which threw `ReferenceError:
// require is not defined` under ESM (issue #74), silently breaking every
// `db.*` call site. The explicit throw below surfaces a missing
// DATABASE_URL at boot instead of letting the proxy swallow it.

let _db: ReturnType<typeof drizzle> | null = null

function getDb(): ReturnType<typeof drizzle> {
  if (_db) return _db
  const url = serverEnv.DATABASE_URL
  console.error("[db-debug-2] process.env.DATABASE_URL=", process.env.DATABASE_URL, " serverEnv.DATABASE_URL=", url)
  if (!url) {
    throw new Error("DATABASE_URL is required for @workspace/database")
  }
  const pool = postgres(url, {
    prepare: false,
    max: 10,
    idle_timeout: 60,
    max_lifetime: 60 * 30,
  })
  _db = drizzle(pool, { schema })
  return _db
}

// Accessor — consumers use `db`, never `_db`. The Proxy defers pool creation
// until a property is actually accessed (e.g. by drizzle queries at runtime).
export const db = new Proxy({} as ReturnType<typeof drizzle>, {
  get(_target, prop) {
    return getDb()[prop as keyof ReturnType<typeof drizzle>]
  },
})
