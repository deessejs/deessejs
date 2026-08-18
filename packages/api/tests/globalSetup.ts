/**
 * Vitest global setup for the API integration suite.
 *
 * Runs once before workers start. Exposes a single boolean,
 * `postgres:ready`, via `project.provide(...)`. Tests read it
 * via `inject('postgres:ready')` and skip loudly when false.
 *
 * Per ADR-016 (round 4 — warm the pool):
 *   - The check is a real `SELECT 1` against the CI Postgres
 *     service, not `pg_isready`. `pg_isready` only checks TCP
 *     reachability and skips auth, TLS, and protocol-version
 *     failures. A real query catches the modes that the
 *     readiness route (`packages/api/src/http/routes/http.ts:47-54`)
 *     actually exercises.
 *   - The query is run through the same postgres client config
 *     the app uses (`prepare: false, max: 10, idle_timeout: 60`),
 *     so a successful query proves the pool can be created
 *     end-to-end. The pool itself is closed before the test
 *     workers start — the app's `db` proxy creates its own
 *     pool on first access; we just want to confirm the
 *     connection works.
 *   - The skip is loud, not silent: a WARN line is emitted so
 *     the absence of the readiness test surfaces in the log
 *     aggregator. A misconfigured CI that should have provided
 *     Postgres is visible, not silent.
 *
 * The setup is registered in `packages/api/vitest.config.ts`
 * via `vitestConfig({ globalSetup: "./tests/globalSetup.ts" })`.
 */
import postgres from "postgres"

const DEFAULT_TIMEOUT_MS = 5_000
const BASELINE_DATABASE_URL =
  "postgresql://test:test@localhost:5432/test"

const resolveDatabaseUrl = (): string => {
  return process.env.DATABASE_URL ?? BASELINE_DATABASE_URL
}

const checkPostgres = async (url: string): Promise<boolean> => {
  const pool = postgres(url, {
    prepare: false,
    max: 10,
    idle_timeout: 60,
    max_lifetime: 60 * 30,
    connection_timeout: 5,
  })
  try {
    await Promise.race([
      pool`SELECT 1`,
      new Promise<never>((_, reject) =>
        setTimeout(
          () => reject(new Error("postgres:ready timeout")),
          DEFAULT_TIMEOUT_MS,
        ),
      ),
    ])
    return true
  } catch {
    return false
  } finally {
    await pool.end().catch(() => {
      // The pool may already be closed or never opened. Swallow.
    })
  }
}

export const setup = async (project: {
  provide: (key: string, value: unknown) => void
}): Promise<void> => {
  const databaseUrl = resolveDatabaseUrl()
  const ready = await checkPostgres(databaseUrl)

  console.warn(`[api-tests] postgres:ready=${ready} (url=${redact(databaseUrl)})`)

  project.provide("postgres:ready", ready)
}

/**
 * Strip the user:password segment from a Postgres URL before
 * logging it. The CI job sets the real password; we don't want
 * it in stdout.
 */
const redact = (url: string): string => {
  try {
    const u = new URL(url)
    if (u.password) u.password = "***"
    return u.toString()
  } catch {
    return "<unparseable url>"
  }
}