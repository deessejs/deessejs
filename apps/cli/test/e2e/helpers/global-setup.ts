import { execa, type ExecaError } from "execa"
import getPort from "get-port"
import { resolve } from "node:path"
import { drizzle } from "drizzle-orm/node-postgres"
import { migrate } from "drizzle-orm/node-postgres/migrator"
import { reset, seed } from "drizzle-seed"
import type { TestProject } from "vitest/node"
import * as schema from "@workspace/database/schema"
import { startLocalServer, type ServerHandle } from "./server.js"

/**
 * Spike global setup (ADR-015).
 *
 * Boots the local server, runs DB migrations + drizzle-seed, and
 * shares the server URL with test files via project.provide.
 *
 * This is a spike. The implementation will reuse this file or
 * replace it with a senior version. The goal here is to answer
 * three questions:
 *
 * 1. Can we spawn a Next.js production server inside Vitest's
 *    globalSetup and health-check it?
 * 2. Can drizzle-seed run before the server boots?
 * 3. Can execa invoke the CLI tarball against that server and
 *    produce a parseable stdout?
 */
let server: ServerHandle | null = null
let db: ReturnType<typeof drizzle> | null = null

export default async function setup(project: TestProject) {
  // 1. Connect to the test database.
  const databaseUrl = process.env.DATABASE_URL
  if (!databaseUrl) {
    throw new Error(
      "DATABASE_URL is not set. The e2e suite requires a running Postgres. " +
        "Set DATABASE_URL=postgres://test:test@localhost:5432/test or skip this suite.",
    )
  }
  db = drizzle(databaseUrl)

  // 2. Run migrations. drizzle-seed's reset() expects the schema
  //    to exist. migrate() is idempotent.
  const migrationsFolder = resolve(
    process.cwd(),
    "..",
    "..",
    "packages",
    "database",
    "drizzle",
  )
  await migrate(db, { migrationsFolder })

  // 3. Reset to a known empty state and seed one user.
  //    drizzle-seed's seed() is deterministic given a seed number.
  await reset(db, schema)
  await seed(db, { user: schema.user }, { seed: 42 }).refine((f) => ({
    user: {
      count: 1,
      columns: {
        id: f.valuesFromArray({ values: ["e2e-test-user-id"] }),
        email: f.valuesFromArray({ values: ["[email protected]"] }),
        name: f.valuesFromArray({ values: ["e2e-test-user"] }),
      },
    },
  }))

  // 4. Pick a free port. Next.js does not support port 0 (OS
  //    picks free port). We use get-port and pass the result
  //    via -p.
  const port = await getPort({ port: 30_000 })

  // 5. Start the local server. We build first (slow, ~1-3 min)
  //    so the spike is self-contained. The implementation
  //    will pre-build and cache.
  await execa("pnpm", ["--filter", "app", "build"], {
    stdio: "ignore",
  })
  server = await startLocalServer({ port, hostname: "127.0.0.1" })

  // 6. Share the URL with the test files.
  project.provide("serverUrl", server.url)

  return async () => {
    if (server !== null) {
      await server.stop()
      server = null
    }
  }
}
