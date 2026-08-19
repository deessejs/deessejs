/**
 * Vitest global setup for the API integration suite.
 *
 * Runs once before workers start. Exposes two readiness flags,
 * `postgres:ready` and `github:ready`, via `project.provide(...)`.
 * Tests read them via `inject('...')` and skip loudly when false.
 *
 * Per ADR-016 (round 4 — warm the pool):
 *   - The Postgres check is a real `SELECT 1` against the CI
 *     Postgres service, not `pg_isready`. `pg_isready` only
 *     checks TCP reachability and skips auth, TLS, and
 *     protocol-version failures. A real query catches the
 *     modes that the readiness route
 *     (`packages/api/src/http/routes/http.ts:47-54`) actually
 *     exercises.
 *   - The query runs through the same postgres client config
 *     the app uses (`prepare: false, max: 10, idle_timeout: 60`),
 *     so a successful query proves the pool can be created
 *     end-to-end. The pool itself is closed before the test
 *     workers start — the app's `db` proxy creates its own
 *     pool on first access; we just want to confirm the
 *     connection works.
 *
 * Per ADR-017 (real-network enrich):
 *   - The GitHub check probes `GET https://api.github.com/rate_limit`
 *     with the `GITHUB_TOKEN` injected from the CI env (the
 *     same secret the workflow uses for release and changesets).
 *     The probe reads the `core.remaining` field and exposes
 *     `github:ready=true` when the remaining quota is at or
 *     above the threshold (10 by default). Below the threshold,
 *     or on any network/protocol failure, `github:ready=false`.
 *   - The probe costs 1 GitHub request per CI run. With a
 *     `GITHUB_TOKEN`, the budget is 5000 req/h — the probe is
 *     a rounding error.
 *
 * Skips are loud, not silent: a WARN line is emitted on stderr
 * so the absence of a test surfaces in the log aggregator. A
 * misconfigured CI that should have provided Postgres or
 * GitHub credentials is visible.
 *
 * The setup is registered in `packages/api/vitest.config.ts`
 * via `vitestConfig({ globalSetup: "./tests/globalSetup.ts" })`.
 */
import postgres from "postgres"

const DEFAULT_TIMEOUT_MS = 5_000
const GITHUB_PROBE_TIMEOUT_MS = 3_000
const GITHUB_RATE_LIMIT_THRESHOLD = 10
const BASELINE_DATABASE_URL =
  "postgresql://test:test@localhost:5432/test"
const GITHUB_API = "https://api.github.com"

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

type GithubCheck = { ready: boolean; remaining?: number; limit?: number }

const checkGithub = async (token: string | undefined): Promise<GithubCheck> => {
  const headers: Record<string, string> = {
    Accept: "application/vnd.github+json",
    "X-GitHub-Api-Version": "2022-11-28",
    "User-Agent": "deessejs-api-tests",
  }
  if (token) headers.Authorization = `Bearer ${token}`
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), GITHUB_PROBE_TIMEOUT_MS)
  try {
    const response = await fetch(`${GITHUB_API}/rate_limit`, {
      headers,
      signal: controller.signal,
    })
    if (!response.ok) return { ready: false }
    const payload = (await response.json()) as {
      resources?: { core?: { remaining?: number; limit?: number } }
    }
    const remaining = payload.resources?.core?.remaining
    const limit = payload.resources?.core?.limit
    if (typeof remaining !== "number") return { ready: false }
    return {
      ready: remaining >= GITHUB_RATE_LIMIT_THRESHOLD,
      remaining,
      limit,
    }
  } catch {
    return { ready: false }
  } finally {
    clearTimeout(timer)
  }
}

export const setup = async (project: {
  provide: (key: string, value: unknown) => void
}): Promise<void> => {
  console.warn(`[api-tests-debug] main process process.env.DATABASE_URL=${process.env.DATABASE_URL}`)
  const databaseUrl = resolveDatabaseUrl()
  const postgresReady = await checkPostgres(databaseUrl)
  console.warn(
    `[api-tests] postgres:ready=${postgresReady} (url=${redact(databaseUrl)})`,
  )
  project.provide("postgres:ready", postgresReady)

  const githubCheck = await checkGithub(process.env.GITHUB_TOKEN)
  const tokenState = process.env.GITHUB_TOKEN ? "with-token" : "anonymous"
  console.warn(
    `[api-tests] github:ready=${githubCheck.ready} ` +
      `(remaining=${githubCheck.remaining ?? "?"}/${githubCheck.limit ?? "?"}, ${tokenState})`,
  )
  project.provide("github:ready", githubCheck.ready)
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