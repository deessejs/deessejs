/**
 * Database test setup
 *
 * Supports multiple database backends for testing:
 * 1. pg-mem (default for unit tests, no Docker needed)
 * 2. Real PostgreSQL via TEST_DATABASE_URL env var
 * 3. GitHub Actions CI with PostgreSQL service
 */
import { drizzle } from "drizzle-orm/postgres-js"
import postgres from "postgres"
import { afterAll, beforeAll } from "vitest"
import { serverEnv } from "@workspace/env/server"

// Database instances
let _sql: ReturnType<typeof postgres> | null = null
let _testDb: ReturnType<typeof drizzle> | null = null
// eslint-disable-next-line @typescript-eslint/no-explicit-any
let _pgMemDb: any = null

// Initialize pg-mem for schema tests
async function initPgMem() {
  try {
    const { newDb } = await import("pg-mem")
    const db = newDb()

    // Create schema from our tables
    db.public.none(`
      CREATE TABLE "user" (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        email TEXT NOT NULL UNIQUE,
        email_verified BOOLEAN DEFAULT FALSE NOT NULL,
        image TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE "session" (
        id TEXT PRIMARY KEY,
        expires_at TIMESTAMP NOT NULL,
        token TEXT NOT NULL UNIQUE,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL,
        ip_address TEXT,
        user_agent TEXT,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE
      );

      CREATE TABLE "account" (
        id TEXT PRIMARY KEY,
        account_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        user_id TEXT NOT NULL REFERENCES "user"(id) ON DELETE CASCADE,
        access_token TEXT,
        refresh_token TEXT,
        id_token TEXT,
        access_token_expires_at TIMESTAMP,
        refresh_token_expires_at TIMESTAMP,
        scope TEXT,
        password TEXT,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );

      CREATE TABLE "verification" (
        id TEXT PRIMARY KEY,
        identifier TEXT NOT NULL,
        value TEXT NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT NOW() NOT NULL,
        updated_at TIMESTAMP DEFAULT NOW() NOT NULL
      );
    `)

    return db
  } catch (err) {
    console.warn("pg-mem initialization failed:", err)
    return null
  }
}

// Initialize real PostgreSQL
async function initPostgres(url: string) {
  const sql = postgres(url, { max: 1 })
  return { sql, db: drizzle(sql) }
}

beforeAll(async () => {
  // Priority: TEST_DATABASE_URL > pg-mem
  if (serverEnv.TEST_DATABASE_URL) {
    const result = await initPostgres(serverEnv.TEST_DATABASE_URL)
    _sql = result.sql
    _testDb = result.db
  } else {
    // Try pg-mem for fast unit tests
    _pgMemDb = await initPgMem()
  }
}, 60000)

afterAll(async () => {
  if (_sql) {
    await _sql.end()
  }
})

// Export the test database instance
export const testDb = {
  get db() {
    if (_testDb) return _testDb
    if (_pgMemDb) {
      // Return pg-mem adapter (limited functionality)
      return {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        execute: (strings: TemplateStringsArray, ...values: any[]) => {
          return _pgMemDb.public.all(
            strings.reduce((acc, str, i) => acc + str + (values[i] ?? ""), ""),
          )
        },
        select: () => _pgMemDb.public,
      }
    }
    throw new Error("No database connection")
  },
  get isConnected() {
    return _testDb !== null || _pgMemDb !== null
  },
  get isPgMem() {
    return _pgMemDb !== null && _testDb === null
  },
}

// Cleanup helper
export async function cleanup() {
  if (_sql) {
    await _sql.end()
    _sql = null
    _testDb = null
  }
  _pgMemDb = null
}

// Check if tests can run
export const canRunDatabaseTests = {
  get value() {
    return testDb.isConnected
  },
}
