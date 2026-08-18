/**
 * Vitest global setup for the API integration suite.
 *
 * Runs once before workers start. Exposes a single boolean,
 * `postgres:ready`, via `project.provide(...)`. Tests read it
 * via `inject('postgres:ready')` and skip loudly when false.
 *
 * Per ADR-016:
 *   - The check is `pg_isready` against the CI service URL,
 *     not a Postgres protocol handshake. `pg_isready` is cheap
 *     and short-circuits on the common failure modes
 *     (ECONNREFUSED, auth failures, DNS).
 *   - The skip is loud, not silent: a WARN line is emitted via
 *     the structured logger so the absence of the readiness
 *     test surfaces in the log aggregator.
 *   - Non-DB tests do not call `inject('postgres:ready')` and
 *     are unaffected by the flag.
 *
 * The setup is registered in `packages/api/vitest.config.ts`
 * via `vitestConfig({ globalSetup: "./tests/globalSetup.ts" })`.
 */
import { spawn } from "node:child_process"

const DEFAULT_TIMEOUT_MS = 5_000
const BASELINE_DATABASE_URL =
  "postgresql://test:test@localhost:5432/test"

const resolveDatabaseUrl = (): string => {
  return process.env.DATABASE_URL ?? BASELINE_DATABASE_URL
}

const parseHostPort = (url: string): { host: string; port: number } => {
  // Default Postgres URL form: postgresql://user:pass@host:port/db
  // We accept the same prefix that better-auth/drizzle accept.
  try {
    const u = new URL(url)
    const host = u.hostname || "localhost"
    const port = u.port ? Number(u.port) : 5432
    return { host, port }
  } catch {
    return { host: "localhost", port: 5432 }
  }
}

const checkPostgres = (host: string, port: number): Promise<boolean> => {
  return new Promise((resolve) => {
    const child = spawn(
      "pg_isready",
      ["-h", host, "-p", String(port), "-t", "3"],
      { stdio: ["ignore", "ignore", "ignore"] },
    )
    const timer = setTimeout(() => {
      child.kill("SIGKILL")
      resolve(false)
    }, DEFAULT_TIMEOUT_MS)
    child.on("exit", (code) => {
      clearTimeout(timer)
      resolve(code === 0)
    })
    child.on("error", () => {
      clearTimeout(timer)
      resolve(false)
    })
  })
}

export const setup = async (project: {
  provide: (key: string, value: unknown) => void
}): Promise<void> => {
  const databaseUrl = resolveDatabaseUrl()
  const { host, port } = parseHostPort(databaseUrl)
  const ready = await checkPostgres(host, port)

  // eslint-disable-next-line no-console
  console.warn(
    `[api-tests] postgres:ready=${ready} (host=${host} port=${port})`,
  )

  project.provide("postgres:ready", ready)
}
